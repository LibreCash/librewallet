'use strict';
var emissionCtrl = function($scope, $sce, walletService, libreService, $rootScope, $translate) {
    var bankAddress = libreService.bank.address,
        cashAddress = libreService.token.address,
        bankAbiRefactor = libreService.bank.abi,
        cashAbiRefactor = libreService.token.abi,
        getTokenData = libreService.methods.getTokenData,
        getContractData = libreService.methods.getContractData,
        getBankDataProcess = libreService.methods.getBankDataProcess,
        getCashDataProcess = libreService.methods.getCashDataProcess,
        getLBRSDataProcess = libreService.methods.getLBRSDataProcess,
        getDataString = libreService.methods.getDataString,
        toUnixtime = libreService.methods.toUnixtime,
        toUnixtimeObject = libreService.methods.toUnixtimeObject,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        stateName = libreService.methods.stateName,
        coeff = libreService.coeff,
        fillStateData = libreService.methods.fillStateData,
        libreTransaction = libreService.methods.libreTransaction,
        getLibreRawTx = libreService.methods.getLibreRawTx,
        canOrder = libreService.methods.canOrder,
        canRequest = libreService.methods.canRequest,
        canCalc = libreService.methods.canCalc,
        getNetwork = libreService.methods.getNetwork,
        
        getEstimatedGas = libreService.methods.getEstimatedGas,
        IS_DEBUG = libreService.IS_DEBUG;

    const gasPriceKey = "gasPrice",
          loadingText = "...";

    if (getNetwork() == '') {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;

    $scope.cashAddress = cashAddress;
    $scope.bankAddress = bankAddress;
    $scope.buyOrSell = true;

    $scope.states = coeff.statesENUM;

    var RATE_ACTUAL = coeff.rateActual;
    var ORACLE_TIMEOUT = coeff.oracleTimeout;
    var ORACLE_ACTUAL = coeff.oracleActual;
    var GIGA = Math.pow(10, 9);
    var TOKEN_COEFF = Math.pow(10, libreService.coeff.tokenDecimals);
    $scope.MIN_READY_ORACLES = coeff.minReadyOracles;

    $scope.deadlineRemains = 0;
    $scope.calcRatesRemains = 0;
    $scope.gasPrice = {};
    $scope.txFees = {};
    $scope.txModal = {};

    $scope.callbackGas = coeff.callbackGas;

    //$scope.allTokens = 'Loading';
    $scope.approvePending = false;
    $scope.sellPending = false;
    $scope.buyPending = false;
    $scope.orderAllowed = false;
    $scope.CRPending = false;
    $scope.updateRatesPending = false;
    $scope.updateRatesAllowed = false;
    $scope.calcRatesAllowed = false;
    $scope.changedTokens = 0;
    $scope.changedEth = 0;

    $scope.txModal = new Modal(document.getElementById('txModal'));

    $scope.Validator = Validator;
    var currentTab = $scope.globalService.currentTab;
    var tabs = $scope.globalService.tabs;
    var oracleCount = 6,
        gasLimit = 150000;

    $scope.tx = {
        unit: "ether",
        sendMode: "ether",
        nonce: null,
        gasPrice: null,
        donate: false,
        tokensymbol: false
    }
    $scope.tx.readOnly = false;

    // remission
    function processSellRate(data) {
        $scope.sellRate = data.error ? data.message : normalizeRate(data.data[0]);
    }
    function processTokenCount(data) {
        $scope.tokenCount = data.error ? data.message : normalizeRate(data.data[0]);
    };

    function setAllTokens(data) {
        $scope.allTokens = data.data[0] / TOKEN_COEFF;
    }

    function setLBRSBalance(data) {
        $scope.LBRSBalance = data.data[0] / TOKEN_COEFF;
    }

    function setAllowance(data) {
        $scope.allowedTokens = data.data[0] / TOKEN_COEFF;
    }

    function updateBalanceAndAllowance() {
        if (walletService.wallet == null) {
            return;
        }
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
        getLBRSDataProcess("balanceOf", setLBRSBalance, [walletService.wallet.getAddressString()]);
        getCashDataProcess("allowance", setAllowance, [walletService.wallet.getAddressString(), bankAddress]);
    }

    // on-page timers decreasing
    setInterval(() => {
        if ($scope.waitOraclesRemains > 0) {
            $scope.waitOraclesRemains--;
        }

        if ($scope.calcRatesRemains > 0) {
            $scope.calcRatesRemains--;
        }

        let deadlineDays = $scope.deadlineRemains / (60 * 60 * 24);

        if ($scope.deadlineRemains > 0) {
            $scope.deadlineRemains--;
        }

        if (deadlineDays != $scope.deadlineDays) {
            $scope.deadlineDays = Math.floor(deadlineDays);
        }

        if ($scope.rateActualTime > 0) {
            $scope.rateActualTime--;
        }
        if ($scope.globalService.currentTab == $scope.globalService.tabs.emission.id) {
            applyScope();
        }
    }, 1000);

    if (libreService.mainTimer !== null) {
        clearInterval(libreService.mainTimer)
    }
    
    var lastCalcTime, lastRequestTime, lastLastBlockTime, deadline = 0, gasPrice = 0;
    $scope.pendingOrderAllowCheck = false;
    var timerTicker = 0;
    libreService.mainTimer = setInterval(() => {
        if (IS_DEBUG) console.info("TIMER", ++timerTicker)
        if ($scope.globalService.currentTab == $scope.globalService.tabs.emission.id) {
            if ($scope.pendingOrderAllowCheck) {
                return;
            }
            $scope.pendingOrderAllowCheck = true;

            ajaxReq.getLatestBlockData(function(blockData) {
                var lastBlockTime = parseInt(blockData.data.timestamp, 16);
                if (IS_DEBUG) console.info("BEFORE PROMISES")
                Promise.all([
                    getContractData("getState"),
                    getContractData("tokenBalance"),
                    getContractData("requestPrice"),
                    getContractData("calcTime"),
                    getContractData("readyOracles"),
                    getContractData("getOracleData", [0]),
                    getContractData("oracleCount"),
                    getContractData("requestTime"),
                    walletService.wallet == null ? { data: 0 } :
                        getTokenData("balanceOf", [walletService.wallet.getAddressString()]),
                    walletService.wallet == null ? { data: 0 } :
                        getTokenData("allowance", [walletService.wallet.getAddressString(), bankAddress]),
                    $scope.deadlineRemains == 0 ? getContractData("deadline") : { data : 0 }
                ]).then(async (values) => {
                    if (IS_DEBUG) console.info("PROMISES DONE")
                    try {
                        let 
                            state = values[0],
                            exchangerTokenBalance = values[1],
                            updateRatesCost = values[2],
                            calcTime = values[3],
                            readyOracles = values[4],
                            firstOracleData = values[5], // different methods in bank branch!
                            requestTime = values[7],
                            userTokenBalance = values[8],
                            allowedTokens = values[9];
                        if (values[10].data !== 0) {
                            deadline = values[10]
                        }
                        oracleCount = values[6];
                        ajaxReq.getBalance(bankAddress, function(balanceData) {
                            $scope.ethBalance = etherUnits.toEther(balanceData.data.balance, 'wei');
                        });

                        let stateDec = +state.data[0];
                        if ($scope.state != stateDec) {
                            if (stateDec == libreService.coeff.statesENUM.PROCESSING_ORDERS) {
                                updateContractData();
                            }
                        }
                        $scope.state = stateDec;
                        $scope.allowedTokens = +allowedTokens.data[0] / TOKEN_COEFF;
                        $scope.allTokens = +userTokenBalance.data[0] / TOKEN_COEFF;

                        $scope.tokenBalance = +exchangerTokenBalance.data[0] / TOKEN_COEFF;

                        $scope.readyOracles = +readyOracles.data[0];
                        $scope.oracleCount = +oracleCount.data[0];

                        $scope.orderAllowed = (stateDec == libreService.coeff.statesENUM.PROCESSING_ORDERS);
                        $scope.updateRatesAllowed = (stateDec == libreService.coeff.statesENUM.REQUEST_RATES);
                        $scope.calcRatesAllowed = (stateDec == libreService.coeff.statesENUM.CALC_RATES);
                        if ($scope.updateRatesAllowed) {
                            $scope.updateRatesCost = updateRatesCost.data[0] / TOKEN_COEFF;
                        }

                        if (lastLastBlockTime != lastBlockTime || lastCalcTime != +calcTime.data[0]) {
                            $scope.rateActualTime = RATE_ACTUAL - (lastBlockTime - +calcTime.data[0]);
                            lastCalcTime = +calcTime.data[0];
                        }

                        if (lastLastBlockTime != lastBlockTime || lastRequestTime != +requestTime.data[0]) {
                            $scope.waitOraclesRemains = ORACLE_TIMEOUT - (lastBlockTime - +requestTime.data[0]);
                            $scope.calcRatesRemains = ORACLE_ACTUAL - (lastBlockTime - +requestTime.data[0]);
                            lastRequestTime = +requestTime.data[0]
                        }

                        if (+deadline.data != 0) {
                            if (lastLastBlockTime != lastBlockTime) {
                                $scope.deadlineRemains = +deadline.data[0] - lastBlockTime;
                                $scope.deadlineDays = Math.floor($scope.deadlineRemains / (60 * 60 * 24));
                            }
                        }

                        gasPrice = await libreService.methods.getDataAsync(
                            firstOracleData.data[0],
                            libreService.oracleABI,
                            "gasPrice"
                        );
                        
                        gasLimit = await libreService.methods.getDataAsync(
                            firstOracleData.data[0],
                            libreService.oracleABI,
                            "gasLimit"
                        );
                        
                        $scope.recountRatesCost();

                        if (lastLastBlockTime != lastBlockTime) {
                            lastLastBlockTime = lastBlockTime;
                        }
                    } catch (error) {
                          $scope.notifier.danger(error)
                    }

                    $scope.pendingOrderAllowCheck = false;
                    applyScope()
                    if (IS_DEBUG) console.info("SYNC CYCLE END")
                });
            });
    

        }
    }, 5000);

    function applyScope() {
        if (!$scope.$$phase) $scope.$apply();
    }

    $scope.recountRatesCost = function() {
        let newGas = $scope.callbackGas.value * GIGA;
        let oldGas = +gasPrice.data[0];
        let estimate = $scope.updateRatesCost * TOKEN_COEFF,
            a = oracleCount.data[0] * gasLimit.data[0],
            b = estimate - oldGas * a,
            bMax = 2 * b;
        if (estimate == 0) {
            $scope.callbackGas.recalculated = $scope.callbackGas.recalculatedMax = 0;    
        } else {
            $scope.callbackGas.recalculated = (newGas * a + b) / TOKEN_COEFF;
            $scope.callbackGas.recalculatedMax = (newGas * a + bMax) / TOKEN_COEFF;    
        }
    }

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return;
        $scope.wallet = walletService.wallet;
        updateContractData();
        updateBalanceAndAllowance();

        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.$watch(function() {
        return +globalFuncs.localStorage.getItem(gasPriceKey, null) +
                +$scope.tx.gasLimit +
                +$scope.txModal.estimatedGas;
    }, function() {
        $scope.gasPrice.gwei = globalFuncs.localStorage.getItem(gasPriceKey, null) ? +(globalFuncs.localStorage.getItem(gasPriceKey)) : 20;
        if ($scope.txModal.estimatedGas !== loadingText) {
            $scope.txModal.estimatedFee = etherUnits.toEther(
                etherUnits.toWei($scope.gasPrice.gwei, 'gwei') * $scope.txModal.estimatedGas,
            'wei');
        }
        $scope.txModal.maximumFee = etherUnits.toEther(
            etherUnits.toWei($scope.gasPrice.gwei, 'gwei') * $scope.tx.gasLimit,
        'wei');
        applyScope();
    });

    function isEnough(valA, valB) {
        if (valA.toString() == '') return 0;
        return new BigNumber(valA.toString()).lte(new BigNumber(valB.toString()));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    $scope.updateGas = function() {
        getLibreRawTx($scope).then((rawTx) => {
            return getEstimatedGas(rawTx);
        }).then(function(gas) {
            $scope.txModal.estimatedGas = +gas.data;
        }, function(error) {
            $scope.notifier.danger(error);
        });
    }

    function processBuyRate(data) {
        $scope.buyRate = data.error ? data.message : normalizeRate(data.data[0]);
    };

    function updateContractData() {
        getBankDataProcess("buyRate", processBuyRate);
        getBankDataProcess("sellRate", processSellRate);
        if (walletService.wallet != null) {
            updateBalanceAndAllowance();
        }
    }
    updateContractData();

    function setOpenModal(maxGas, action, title) {
        $translate(title).then((caption) => {
            $scope.txModal.maximumFee = loadingText;
            $scope.tx.gasLimit = maxGas;
            $scope.tx.value = loadingText;
            $scope.txModal.estimatedFee = loadingText;
            $scope.txModal.estimatedGas = loadingText;
            $scope.txModal.modalClick = action;
            $scope.txModal.title = caption;
            $scope.txModal.open();
            action(/* estimate = */ true);
        });
    }

    $scope.updateRatesModal = function() {
        setOpenModal(coeff.gasUpdateRates, $scope.updateRatesTx, "LIBRE_captionUpdateRates");
    }

    $scope.approveModal = function() {
        setOpenModal(coeff.gasApprove, $scope.approveTx, "LIBRE_captionApprove");
    }

    $scope.calcRatesModal = function() {
        setOpenModal(coeff.gasCalcRates, $scope.calcRatesTx, "LIBRE_captionCalcRates");
    }

    $scope.buyModal = function() {
        setOpenModal(coeff.gasEmission, $scope.buyTx, "LIBRE_captionBuyTransaction");
    }

    $scope.sellModal = function() {
        setOpenModal(coeff.gasRemission, $scope.sellTx, "LIBRE_captionSellTransaction");
    }

    function prepareApproveTx() {
        return new Promise((resolve, reject) => {
            if (walletService.wallet == null) {
                $translate("LIBRE_nullWallet").then((msg) => reject(msg));
            }
            getTokenData("allowance", [walletService.wallet.getAddressString(), bankAddress]).then((allowanceData) => {
                if (allowanceData.error) {
                    reject(allowanceData.msg);
                }
                var allowance = +allowanceData.data[0];
                var tokensToAllowCount = $scope.tokensToAllow * TOKEN_COEFF;
                if (allowance == tokensToAllowCount) {
                    $translate("LIBREALLOWANCE_equal").then((msg) => reject(msg));
                } else if (tokensToAllowCount < allowance) {
                    $scope.tx.data = getDataString(
                        cashAbiRefactor["decreaseApproval"], [bankAddress, allowance - tokensToAllowCount]
                    );
                } else {
                    // tokensToAllowCount > allowance
                    $scope.tx.data = getDataString(
                        cashAbiRefactor["increaseApproval"], [bankAddress, tokensToAllowCount - allowance]
                    );
                }
                $scope.tx.to = cashAddress;
                $scope.tx.value = 0;
                resolve();
            });
        });
    }

    $scope.approveTx = function(estimate = false) {
        if (!estimate) $scope.txModal.close();
        prepareApproveTx().then(function() {
            if (!estimate) {
                libreTransaction($scope, "approve", "ALLOWANCE", $translate, updateBalanceAndAllowance);
            } else {
                $scope.updateGas();
            }
        },
        function(err) {
            $scope.notifier.danger(err);
        });
    }

    function prepareUpdateRatesTx() {
        $scope.tx.data = getDataString(bankAbiRefactor["requestRates"], [$scope.callbackGas.value * GIGA]);
        $scope.tx.to = bankAddress;
        $scope.tx.value = $scope.callbackGas.recalculatedMax;
        $scope.tx.unit = 'ether';
    }

    $scope.updateRatesTx = function(estimate = false) {
        if (!estimate) $scope.txModal.close();
        canRequest().then(() => {
            return prepareUpdateRatesTx();
        }).catch(function(err) {
            $scope.notifier.danger(err);
        }).then(function() {
            if (!estimate) {
                libreTransaction($scope, "updateRates", "RUR", $translate, null);
            } else {
                $scope.updateGas();
            }
        }).catch(function(err) {
            $scope.notifier.danger(err);
        });
    }

    $scope.calcRatesTx = function(estimate = false) {
        if (!estimate) $scope.txModal.close();
        canCalc().then(function() {
            $scope.tx.data = getDataString(bankAbiRefactor["calcRates"], []);
            $scope.tx.to = bankAddress;
            $scope.tx.value = 0;
            $scope.tx.unit = 'ether';
    
            if (!estimate) {
                libreTransaction($scope, "calcRates", "CR", $translate, null);
            } else {
                $scope.updateGas();
            }
        }).catch(function(err) {
            $scope.notifier.danger(err);
        });
    }

    $scope.sellTx = function(estimate = false) {
        if (!estimate) $scope.txModal.close();
        canOrder([0, $scope.sellRate]).then(function() {
            var tokenCount = $scope.tokenValue * TOKEN_COEFF;
            $scope.tx.data = getDataString(bankAbiRefactor["sellTokens"], 
                [$scope.wallet.getAddressString(), tokenCount]);
    
            $scope.tx.to = bankAddress;
            $scope.tx.value = 0;
            $scope.tx.unit = 'ether';
            $scope.tx.from = walletService.wallet.getAddressString();

            if (!estimate) {
                libreTransaction($scope, "sell", "SELL", $translate, updateBalanceAndAllowance);
            } else {
                $scope.updateGas();
            }
        }).catch(function(err) {
            $scope.notifier.danger(err);
        });
    }

    $scope.buyTx = function(estimate = false) {
        if (!estimate) $scope.txModal.close();
        canOrder([$scope.buyRate, 0]).then(function() {
            let txData = getDataString(bankAbiRefactor["buyTokens"], [$scope.wallet.getAddressString()]);

            $scope.tx.data = txData;
            $scope.tx.to = bankAddress;
            $scope.tx.value = $scope.buyTXValue;

            if (!estimate) {
                libreTransaction($scope, "buy", "BUY", $translate, updateBalanceAndAllowance);
            } else {
                $scope.updateGas();
            }
        }).catch(function(err) {
            $scope.notifier.danger(err);
        });
    }

    $scope.transferAllBalance = function() {
        uiFuncs.transferAllBalance($scope.wallet.getAddressString(), coeff.gasEmission, function(resp) {
            if (!resp.isError) {
                $scope.tx.unit = resp.unit;
                $scope.tx.value = resp.value;
                $scope.buyTXValue = resp.value;
                $scope.changedTokens = resp.value * $scope.buyRate;
            } else {
                $scope.notifier.danger(resp.error);
            }
        });
    }
};
module.exports = emissionCtrl;
