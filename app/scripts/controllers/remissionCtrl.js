'use strict';
var remissionCtrl = async function($scope, $sce, walletService, libreService, $rootScope, $translate) {
    var bankAddress = libreService.bank.address,
        cashAddress = libreService.token.address,
        bankAbiRefactor = libreService.bank.abi,
        cashAbiRefactor = libreService.token.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        getCashDataAsync = libreService.methods.getCashDataAsync,
        getBankDataProcess = libreService.methods.getBankDataProcess,
        getCashDataProcess = libreService.methods.getCashDataProcess,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        getDataString = libreService.methods.getDataString,
        fillStateData = libreService.methods.fillStateData,
        normalizeRate = libreService.methods.normalizeRate,
        rateMultiplier = libreService.coeff.rateMultiplier,
        gasRemission = libreService.coeff.gasRemission,
        gasApprove = libreService.coeff.gasApprove,
        gasWithdraw = libreService.coeff.gasWithdraw,
        universalTxCallback = libreService.methods.universalTxCallback;

    var processSellRate = function(data) {
        $scope.sellRate = data.error ? data.message : normalizeRate(data.data[0]);
        $scope.tx.rateLimit = data.error ? 0 : normalizeRate(data.data[0] * 0.9); // +10%
    },
    processTokenCount = function(data) {
        $scope.tokenCount = data.error ? data.message : normalizeRate(data.data[0]);
    },
    normalizeUnixTimeObject = function(data) {
        try {
            var _time = normalizeUnixTime(data.data[0]);
            data.data.push(_time);
            return data;
        } catch(e) {
            return {error: true, message: e.message};
        }
    };

    $scope.allTokens = 'Loading';

    $scope.cashAddress = cashAddress;

    $scope.approvePending = false;
    $scope.sellPending = false;
    $scope.tx = {};
    $scope.tx.value = 0;
    $scope.signedTx;
    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;
    $scope.remissionModal = new Modal(document.getElementById('remission'));
    //walletService.wallet = null;
    //walletService.password = '';
    $scope.showAdvance = $rootScope.rootScopeShowRawTx = false;
    $scope.Validator = Validator;
    $scope.gasLimitChanged = false;
    $scope.tx.readOnly = globalFuncs.urlGet('readOnly') == null ? false : true;
    var currentTab = $scope.globalService.currentTab;
    var tabs = $scope.globalService.tabs;
    $scope.tokenTx = {
        to: '',
        value: 0,
        id: -1
    };
    $scope.customGasMsg = '';
          
    $scope.customGas = CustomGasMessages;

    $scope.tx = {
        gasLimit: gasRemission,
        data: "",
        to: bankAddress,
        unit: "ether",
        value: "",
        nonce: null,
        gasPrice: null,
        donate: false,
        tokensymbol: false,
        rateLimit: 0,
        rateLimitReal: 0,
        sendMode: "ether"
    }

    $scope.unitReadable = ajaxReq.type;

    var applyScope = function() {
        if (!$scope.$$phase) $scope.$apply();
    }

    var defaultInit = function() {
        $scope.gasLimitChanged = false;
        $scope.showAdvance = false;
    }

    var setAllTokens = function(data) {
        $scope.allTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    }, 
    setAllowance = function(data) {
        $scope.allowedTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    };

    function updateBalanceAndAllowance() {
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
        getCashDataProcess("allowance", setAllowance, [walletService.wallet.getAddressString(), bankAddress]);
    }

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return; 
        updateContractData();
        updateBalanceAndAllowance();
        $scope.wallet = walletService.wallet;
        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
        $scope.tx.to = bankAddress;
        $scope.tx.value = 0;
        if ($scope.parentTxConfig) {
            var setTxObj = function() {
                $scope.addressDrtv.ensAddressField = $scope.parentTxConfig.to;
                $scope.tx.value = 0;
                $scope.tx.sendMode = 'ether';
                $scope.tx.gasPrice = $scope.parentTxConfig.gasPrice ? $scope.parentTxConfig.gasPrice : null;
                $scope.tx.nonce = $scope.parentTxConfig.nonce ? $scope.parentTxConfig.nonce : null;
                $scope.tx.data = $scope.parentTxConfig.data ? $scope.parentTxConfig.data : $scope.tx.data;
                $scope.tx.readOnly = $scope.addressDrtv.readOnly = $scope.parentTxConfig.readOnly ? $scope.parentTxConfig.readOnly : false;
                if ($scope.parentTxConfig.gasLimit) {
                    $scope.tx.gasLimit = $scope.parentTxConfig.gasLimit;
                    $scope.gasLimitChanged = true;
                }
            }
            $scope.$watch('parentTxConfig', function() {
                setTxObj();
            }, true);
        }
        defaultInit();
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.$watch('tx', function(newValue, oldValue) {
        $rootScope.rootScopeShowRawTx = false;
        updateContractData();
        $scope.tx.rateLimitReal = Math.round($scope.tx.rateLimit * rateMultiplier);
    }, true);

    var isEnough = function(valA, valB) {
        return new BigNumber(valA).lte(new BigNumber(valB));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    function updateContractData() {
        if (walletService.wallet != null) {
            updateBalanceAndAllowance();
            getBankDataProcess("getBalanceEther", function(_balance) {
                $scope.getBalance = _balance.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
            });
        }
        getBankDataProcess("contractState", function(data) {
            $scope.bankState = fillStateData(data);
        });

        getBankDataProcess("cryptoFiatRateSell", processSellRate);
    }
    updateContractData();

    async function statusAllowsOrders(callback) {
        ajaxReq.getLatestBlockData(async function(blockData) {
            var lastBlockTime = parseInt(blockData.data.timestamp, 16);
            await Promise.all([
                getBankDataAsync("timeUpdateRequest"),
                getBankDataAsync("queuePeriod"),
                getBankDataAsync("contractState"),
                getBankDataAsync("paused")
            ]).then(values => {
                let _timeUpdateRequest = values[0],
                    _queuePeriod = values[1],
                    _contractState = values[2],
                    _paused = values[3].data[0];
                $scope.queuePeriod = _queuePeriod;
                $scope.then = +_timeUpdateRequest.data[0] + +_queuePeriod.data[0];
                $scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
                var lastedTime = +lastBlockTime - +_timeUpdateRequest.data[0];
                // allowing orders condition:
                // state == ORDER_CREATION (3) || lastedTime >= _queuePeriod
                if ((_contractState.error) && (_queuePeriod.error)) {
                    $scope.notifier.danger("Getting contract data error");
                    return;
                }
                var allowedState = (!_paused) && ((_contractState.data[0] == 3) || (lastedTime >= _queuePeriod.data[0]));
                if (allowedState)
                    callback();                
                else
                    $scope.notifier.danger("Order creation isn't allowed now. Please look at the status page. Todo translate and add links");
            });
        });
    }

    async function ifNotPaused(callback) {
        getBankDataAsync("paused").then(value => {
            if (value.error) {
                $scope.notifier.danger("Error getting data from contract");
                return;
            }
            var _paused = value.data[0];
            if (!_paused)
                callback();                
            else
                $scope.notifier.danger("LibreBank contract is paused right now");
        });
    }
    
    $scope.generateApproveTx = function() {
        ifNotPaused(callbackApproveTx);
    }

    var callbackApproveTx = async function() {
        var allowanceData = await getCashDataAsync("allowance", [walletService.wallet.getAddressString(), bankAddress]);
        if (allowanceData.error) {
            $scope.notifier.danger(allowanceData.msg);
            return;
        }
        var allowance = +allowanceData.data[0];

        var tokensToAllowCount = $scope.tokensToAllow * Math.pow(10, libreService.coeff.tokenDecimals);
        if (allowance == tokensToAllowCount) {
            $scope.notifier.danger(await $translate("LIBREALLOWANCE_equal"));
            return;
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

        universalTxCallback($scope, "approvePending", "ALLOWANCE", $translate, updateContractData);
    }

    $scope.generateSellLibreTx = function() {
        statusAllowsOrders(callbackSellLibreTx);
    }

    var callbackSellLibreTx = function() {
        $scope.sellPending = true;
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error) {
                        throw(data.msg);
                    }
                    var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals);
                    $scope.tx.data = getDataString(bankAbiRefactor["createSellOrder"], 
                        [$scope.wallet.getAddressString(), tokenCount, $scope.tx.rateLimitReal]);
                    var txData = uiFuncs.getTxData($scope);
                    txData.gasLimit = gasRemission;
                    uiFuncs.generateTx(txData, function(rawTx) {
                        if (rawTx.isError) {
                            $scope.approvePending = false;
                            $scope.notifier.danger(rawTx.error);
                            return;
                        }
                        $scope.rawTx = rawTx.rawTx;
                        $scope.signedTx = rawTx.signedTx;
                        uiFuncs.sendTx($scope.signedTx, function(resp) {
                            if (resp.isError) {
                                $scope.notifier.danger(resp.error);
                                $scope.sellPending = false;
                                return;
                            }
                            var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                            var txHashLink = $scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                            var verifyTxBtn = $scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                            var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                            var completeMsg = '<p>' + globalFuncs.successMsgs[2] + '<strong>' + resp.data + '</strong></p><p>' + verifyTxBtn + ' ' + checkTxBtn + '</p>';
                            $scope.notifier.success(completeMsg, 0);
                            
                            $scope.wallet.setBalance(applyScope);

                            var isCheckingTx = false,
                                checkingTx = setInterval(() => {
                                if (!$scope.sellPending) {
                                    clearInterval(checkingTx);
                                    return;
                                }
                                if (isCheckingTx) return; // fixing doubling success messages
                                isCheckingTx = true;
                                ajaxReq.getTransactionReceipt(resp.data, async (receipt) => {
                                    if (receipt.error) {
                                        $scope.notifier.danger(receipt.msg);
                                        $scope.sellPending = false;
                                    } else {
                                        if (receipt.data != null) {
                                            let status = receipt.data.status;
                                            if (status == "0x1") {
                                                $scope.notifier.success(await $translate("LIBRESELL_txOk"), 0);
                                                updateContractData();
                                            } else {
                                                $scope.notifier.danger(await $translate("LIBRESELL_txFail"), 0);
                                            }
                                            $scope.sellPending = false;
                                        }
                                    }
                                    isCheckingTx = false;
                                });
                            }, 2000);
                        });
                    });
                } catch (e) {
                    $scope.sellPending = false;
                    $scope.notifier.danger(e);
                }
            }); // getTransactionData
        } catch (e) {
            $scope.sellPending = false;
            $scope.notifier.danger(e);
        }
    }

    $scope.generateWithdrawLibreTx = function() {
        ifNotPaused(callbackWithdrawLibreTx);
    }

    //$scope.tx.data = getDataString(bankAbiRefactor["getEther"], []);
    //$scope.gasLimit = gasWithdraw;

    var callbackWithdrawLibreTx = function() {
        $scope.withdrawPending = true;
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error) $scope.notifier.danger(data.msg);
                    $scope.tx.data = getDataString(bankAbiRefactor["getEther"], []);
                    $scope.gasLimit = gasWithdraw;
                    var txData = uiFuncs.getTxData($scope);

                    uiFuncs.generateTx(txData, function(rawTx) {
                        if (rawTx.isError) {
                            $scope.withdrawPending = false;
                            $scope.notifier.danger(rawTx.error);
                            return;
                        }
                        $scope.rawTx = rawTx.rawTx;
                        $scope.signedTx = rawTx.signedTx;
                        uiFuncs.sendTx($scope.signedTx, function(resp) {
                            if (resp.isError) {
                                $scope.notifier.danger(resp.error);
                                $scope.withdrawPending = false;
                                return;
                            }
                            var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                            var txHashLink = $scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                            var verifyTxBtn = $scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                            var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                            var completeMsg = '<p>' + globalFuncs.successMsgs[2] + '<strong>' + resp.data + '</strong></p><p>' + verifyTxBtn + ' ' + checkTxBtn + '</p>';
                            $scope.notifier.success(completeMsg, 0);
                            
                            $scope.wallet.setBalance(applyScope);

                            var isCheckingTx = false,
                            checkingTx = setInterval(() => {
                                if (!$scope.withdrawPending) {
                                    clearInterval(checkingTx);
                                    return;
                                }
                                if (isCheckingTx) return; // fixing doubling success messages
                                isCheckingTx = true;
                                ajaxReq.getTransactionReceipt(resp.data, async (receipt) => {
                                    if (receipt.error) {
                                        $scope.notifier.danger(receipt.msg);
                                        $scope.withdrawPending = false;
                                    } else {
                                        if (receipt.data != null) {
                                            let status = receipt.data.status;
                                            if (status == "0x1") {
                                                $scope.notifier.success(await $translate("LIBREWITHDRAW_txOk"), 0);
                                                updateContractData();
                                            } else {
                                                $scope.notifier.danger(await $translate("LIBREWITHDRAW_txFail"), 0);
                                            }
                                            $scope.withdrawPending = false;
                                        }
                                    }
                                    isCheckingTx = false;
                                });
                            }, 2000);
                        });
                    });
                } catch (e) {
                    $scope.withdrawPending = false;
                    $scope.notifier.danger(e);
                }
            });
        } catch (e) {
            $scope.withdrawPending = false;
            $scope.notifier.danger(e);
        }
    }
};
module.exports = remissionCtrl;
