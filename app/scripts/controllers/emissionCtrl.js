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
        getDataString = libreService.methods.getDataString,
        toUnixtime = libreService.methods.toUnixtime,
        toUnixtimeObject = libreService.methods.toUnixtimeObject,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        stateName = libreService.methods.stateName,
        rateMultiplier = libreService.coeff.rateMultiplier,
        gasEmission = libreService.coeff.gasEmission,
        gasRemission = libreService.coeff.gasRemission,
        gasUpdateRates = libreService.coeff.gasUpdateRates,
        gasApprove = libreService.coeff.gasApprove,
        fillStateData = libreService.methods.fillStateData,
        libreTransaction = libreService.methods.libreTransaction,
        getLibreRawTx = libreService.methods.getLibreRawTx,
        canOrder = libreService.methods.canOrder,
        canRequest = libreService.methods.canRequest,
        canCalc = libreService.methods.canCalc,
        getEstimatedGas = libreService.methods.getEstimatedGas,
        IS_DEBUG = libreService.IS_DEBUG;

    var gasPriceKey = "gasPrice";

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;

    $scope.cashAddress = cashAddress;
    $scope.bankAddress = bankAddress;
    $scope.updateRatesCost = 'n/a';
    $scope.buyOrSell = true;

    $scope.states = libreService.coeff.statesENUM;

    const ORACLE_ACTUAL = 10 * 60; // todo fix constant
    const ORACLE_TIMEOUT = 10 * 60;
    const RATE_PERIOD = 10 * 60;
    $scope.MIN_READY_ORACLES = 2;

    $scope.deadlineRemains = 0;
    $scope.gasPrice = {};
    $scope.txFees = {};
    $scope.txModal = { modalFunc: null };

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
    $scope.buyLimit = gasEmission;
    $scope.sellLimit = gasRemission;
    $scope.updateRatesLimit = gasUpdateRates;
    // modals
    $scope.buyModal = new Modal(document.getElementById('buyTx'));
    $scope.sellModal = new Modal(document.getElementById('sellTx'));
    $scope.urModal = new Modal(document.getElementById('urTx'));
    $scope.txModal = new Modal(document.getElementById('txModal'));

    //$scope.allTokens = 'Loading';
    $scope.Validator = Validator;
    $scope.gasLimitChanged = false;
    var currentTab = $scope.globalService.currentTab;
    var tabs = $scope.globalService.tabs;


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
        $scope.allTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    }

    function setAllowance(data) {
        $scope.allowedTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    }

    function updateBalanceAndAllowance() {
        if (walletService.wallet == null) {
            return;
        }
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
        getCashDataProcess("allowance", setAllowance, [walletService.wallet.getAddressString(), bankAddress]);
    }

    function stateWatcher(newState) {
        if (newState == libreService.coeff.statesENUM.PROCESSING_ORDERS) {
            if (IS_DEBUG) console.log("new rates");
            updateContractData();
        }
    }

    // on-page timers decreasing
    setInterval(() => {
        if ($scope.waitOraclesRemains > 0) {
            $scope.waitOraclesRemains--;
        }

        let deadlineDays = $scope.deadlineRemains / (60 * 60 * 24),
            antiMinute = 1 / (24 * 60); // 

        if ($scope.deadlineRemains > 0) {
            $scope.deadlineRemains--;
        }

        if (deadlineDays % 1 < antiMinute || deadlineDays % 1 > 1 - antiMinute) {
            // if decimal part of days is less than ..., it comes to day changing
            $scope.deadlineDays = Math.floor(deadlineDays);
        }

        if ($scope.rateActualTime > 0) {
            $scope.rateActualTime--;
        }
        if ($scope.globalService.currentTab == $scope.globalService.tabs.emission.id) {
            applyScope();
        }
    }, 1000);

    var lastCalcTime, lastRequestTime, lastLastBlockTime, deadline = 0;
    $scope.pendingOrderAllowCheck = false;
    setInterval(() => {
        if ($scope.globalService.currentTab == $scope.globalService.tabs.emission.id) {
            if ($scope.pendingOrderAllowCheck) {
                return;
            }
            $scope.pendingOrderAllowCheck = true;

            ajaxReq.getLatestBlockData(function(blockData) {
                var lastBlockTime = parseInt(blockData.data.timestamp, 16);

                Promise.all([
                    getContractData("getState"),
                    getContractData("tokenBalance"),
                    getContractData("requestPrice"),
                    getContractData("calcTime"),
                    getContractData("readyOracles"),
                    getContractData("oracleCount"),
                    getContractData("requestTime"),
                    walletService.wallet == null ? { data: 0 } :
                        getTokenData("balanceOf", [walletService.wallet.getAddressString()]),
                    walletService.wallet == null ? { data: 0 } :
                        getTokenData("allowance", [walletService.wallet.getAddressString(), bankAddress])            
                ]).then((values) => {
                    let 
                        state = values[0],
                        exchangerTokenBalance = values[1],
                        updateRatesCost = values[2],
                        calcTime = values[3],
                        readyOracles = values[4],
                        oracleCount = values[5],
                        requestTime = values[6],
                        userTokenBalance = values[7],
                        allowedTokens = values[8];

                    ajaxReq.getBalance(bankAddress, function(balanceData) {
                        $scope.ethBalance = etherUnits.toEther(balanceData.data.balance, 'wei');
                    });

                    let stateDec = +state.data[0];
                    if ($scope.state != stateDec) {
                        stateWatcher(stateDec);
                    }
                    $scope.state = stateDec;
                    $scope.allowedTokens = +allowedTokens.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
                    $scope.allTokens = +userTokenBalance.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);

                    $scope.tokenBalance = +exchangerTokenBalance.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);

                    $scope.readyOracles = +readyOracles.data[0];
                    $scope.oracleCount = +oracleCount.data[0];

                    $scope.orderAllowed = (stateDec == libreService.coeff.statesENUM.PROCESSING_ORDERS);
                    $scope.updateRatesAllowed = (stateDec == libreService.coeff.statesENUM.REQUEST_RATES);
                    $scope.calcRatesAllowed = (stateDec == libreService.coeff.statesENUM.CALC_RATES);
                    if ($scope.updateRatesAllowed) {
                        $scope.updateRatesCost = updateRatesCost.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
                    }

                    if (lastLastBlockTime != lastBlockTime || lastCalcTime != +calcTime.data[0]) {
                        $scope.rateActualTime = ORACLE_ACTUAL - (lastBlockTime - +calcTime.data[0]);
                        lastCalcTime = +calcTime.data[0];
                    }

                    if (lastLastBlockTime != lastBlockTime || lastRequestTime != +requestTime.data[0]) {
                        $scope.waitOraclesRemains = ORACLE_TIMEOUT - (lastBlockTime - +requestTime.data[0]);
                        lastRequestTime = +requestTime.data[0]
                    }

                    if (deadline == 0) {
                        // we need to get deadline only once
                        getContractData("deadline").then((_deadline) => {
                            deadline = _deadline;    
                        })
                    } else {
                        if (lastLastBlockTime != lastBlockTime) {
                            $scope.deadlineRemains = +deadline.data[0] - lastBlockTime;
                            $scope.deadlineDays = Math.floor($scope.deadlineRemains / (60 * 60 * 24));
                        }
                    }

                    if (lastLastBlockTime != lastBlockTime) {
                        lastLastBlockTime = lastBlockTime;
                    }

                    $scope.pendingOrderAllowCheck = false;
                });
            });
    

        }
    }, 5000);

    function applyScope() {
        if (!$scope.$$phase) $scope.$apply();
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
                $scope.txModal.maximumGas +
                $scope.txModal.estimatedGas;
    }, function() {
        $scope.gasPrice.gwei = globalFuncs.localStorage.getItem(gasPriceKey, null) ? +(globalFuncs.localStorage.getItem(gasPriceKey)) : 20;
        // -9 in the next lines because of gigawei
        $scope.txModal.estimatedFee = $scope.gasPrice.gwei * $scope.txModal.estimatedGas / Math.pow(10, libreService.coeff.tokenDecimals - 9);
        $scope.txModal.maximumFee = $scope.gasPrice.gwei * $scope.txModal.maximumGas / Math.pow(10, libreService.coeff.tokenDecimals - 9);
        applyScope();
    });

    function isEnough(valA, valB) {
        return new BigNumber(valA).lte(new BigNumber(valB));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
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

    $scope.generateBuyLibreTx = function() {
        $scope.buyModal.close();
        canOrder($scope, buyLibreTx, [$scope.buyRate, 0]);
    };

    function buyLibreTx() {
        let txData = getDataString(bankAbiRefactor["buyTokens"], [$scope.wallet.getAddressString()]);

        $scope.tx.data = txData;
        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasEmission;
        $scope.tx.value = $scope.buyTXValue;

        libreTransaction($scope, "buyPending", "BUY", $translate, updateBalanceAndAllowance);
    }

    $scope.generateApproveTx = function() {
        $scope.approveTx();
    }

    $scope.approveModal = function() {
        $scope.txModal.open();
        $scope.txModal.cost = 0;
        $scope.txModal.maximumGas = gasApprove;
        $scope.txModal.modalClick = $scope.approveTx;
    }

    function prepareApproveTx() {
        return new Promise((resolve, reject) => {
            if (walletService.wallet == null) {
                $translate("LIBRE_nullWallet").then((msg) => {
                    reject(msg);
                })
            }
            getTokenData("allowance", [walletService.wallet.getAddressString(), bankAddress]).then((allowanceData) => {
                if (allowanceData.error) {
                    reject(allowanceData.msg);
                }
                var allowance = +allowanceData.data[0];
                var tokensToAllowCount = $scope.tokensToAllow * Math.pow(10, libreService.coeff.tokenDecimals);
                if (allowance == tokensToAllowCount) {
                    $translate("LIBREALLOWANCE_equal").then((msg) => {
                        reject(msg);
                    })
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
                $scope.tx.gasLimit = gasApprove;
                $scope.tx.value = 0;
                resolve();
            });
        });
    }

    $scope.approveTx = function(estimate = false) {
        if (!estimate) $scope.txModal.close();
        prepareApproveTx().then(function() {
            if (!estimate) {
                libreTransaction($scope, "approvePending", "ALLOWANCE", $translate, updateBalanceAndAllowance);
            } else {
                console.log("EST~IMATING APPROve");
                getLibreRawTx($scope).then((rawTx) => {
                    console.log("rawtx", rawTx);
                    return getEstimatedGas(rawTx);
                }).then(function(gas) {
                    console.log("gas", gas);
                    $scope.txModal.estimatedGas = +gas.data;
                }, function(error) {
                    $scope.notifier.danger(error.msg);
                });
            }
        },
        function(err) {
            $scope.notifier.danger(err);
        });
    }

    $scope.generateSellLibreTx = function() {
        $scope.sellModal.close();
        canOrder($scope, sellLibreTx, [0, $scope.sellRate]);
    }

    var sellLibreTx = function() {
        var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals)
        $scope.tx.data = getDataString(bankAbiRefactor["sellTokens"], 
            [$scope.wallet.getAddressString(), tokenCount]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasRemission;
        $scope.tx.value = 0;

        libreTransaction($scope, "sellPending", "SELL", $translate, updateBalanceAndAllowance);
    }

    $scope.generateUpdateRatesTx = function() {
        canRequest($scope, updateRatesTx);
    }

    var updateRatesTx = function() {
        $scope.urModal.close();
        getContractData("requestPrice", []).then((oracleDeficit) => {
            $scope.tx.data = getDataString(bankAbiRefactor["requestRates"], []);

            $scope.tx.to = bankAddress;
            $scope.tx.gasLimit = gasUpdateRates;
            $scope.tx.value = etherUnits.toEther(+oracleDeficit.data[0], 'wei');
            $scope.tx.unit = 'ether';
    
            libreTransaction($scope, "updateRatesPending", "RUR", $translate, null);
        });
    }

    $scope.prepareModal = function() {
        $scope.txModal.title = "";
        $scope.txModal.cost = "-";
        $scope.txModal.estimatedGas = "-";
        $scope.txModal.maximumGas = "-";
        $scope.txModal.estimatedFee = "-";
        $scope.txModal.maximumFee = "-";
    }

    $scope.estimateUpdateRatesTx = function() {
        getContractData("requestPrice", []).then((oracleDeficit) => {

            $scope.tx.data = getDataString(bankAbiRefactor["requestRates"], []);
            $scope.tx.to = bankAddress;
            $scope.tx.gasLimit = gasUpdateRates;
            $scope.tx.value = etherUnits.toEther(+oracleDeficit.data[0], 'wei');
            $scope.tx.unit = 'ether';
    
            return getLibreRawTx($scope);
        }).then((rawTx) => {
            return getEstimatedGas(rawTx);
        }).then(function(gas) {
            $scope.updateRatesEstimatedGas = +gas.data;
        }, function(error) {
            $scope.notifier.danger(error.msg);
        });
    }

    $scope.estimateSellTx = function() {
        var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals)
        $scope.tx.data = getDataString(bankAbiRefactor["sellTokens"], 
            [$scope.wallet.getAddressString(), tokenCount]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasRemission;
        $scope.tx.value = 0;

        getLibreRawTx($scope).then((rawTx) => {
            return getEstimatedGas(rawTx);
        }).then(function(gas) {
            $scope.sellEstimatedGas = +gas.data;
        }, function(error) {
            $scope.notifier.danger(error.msg);
        });
    }

    $scope.estimateBuyTx = function() {
        let txData = getDataString(bankAbiRefactor["buyTokens"], [$scope.wallet.getAddressString()]);

        $scope.tx.data = txData;
        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasEmission;
        $scope.tx.value = $scope.buyTXValue;

        getLibreRawTx($scope).then((rawTx) => {
            return getEstimatedGas(rawTx);
        }).then(function(gas) {
            $scope.buyEstimatedGas = +gas.data;
        }, function(error) {
            $scope.notifier.danger(error.msg);
        });
    }

    $scope.generateCalcRatesTx = function() {
        canCalc($scope, calcRatesTx);
    }

    var calcRatesTx = function () {
        $scope.tx.data = getDataString(bankAbiRefactor["calcRates"], []);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = libreService.coeff.gasCalcRates;
        $scope.tx.value = 0;
        $scope.tx.unit = 'ether';

        libreTransaction($scope, "calcRatesPending", "CR", $translate, null);
    }

    $scope.transferAllBalance = function() {
        uiFuncs.transferAllBalance($scope.wallet.getAddressString(), libreService.coeff.gasEmission, function(resp) {
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
