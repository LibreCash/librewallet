'use strict';
var emissionCtrl = async function($scope, $sce, walletService, libreService, $rootScope) {
    var bankAddress = libreService.bank.address,
        bankAbiRefactor = libreService.bank.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        getBankDataProcess = libreService.methods.getBankDataProcess,
        getCashDataProcess = libreService.methods.getCashDataProcess,
        getDataString = libreService.methods.getDataString,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        getStateName = libreService.methods.getStateName,
        rateMultiplier = libreService.coeff.rateMultiplier,
        gasEmission = libreService.coeff.gasEmission;


    $scope.buyPending = false;
    $scope.tx = {};
    $scope.signedTx;
    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;
    $scope.emissionModal = new Modal(document.getElementById('emission'));
    //walletService.wallet = null;
    //walletService.password = '';
    $scope.allTokens = 'Loading';
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
        gasLimit: gasEmission,
        data: "",
        to: bankAddress,
        unit: "ether",
        value: "",
        nonce: null,
        gasPrice: null,
        donate: false,
        tokensymbol: false,
        rateLimit: 0,
        rateLimitReal: 0
    }

    $scope.setSendMode = function(sendMode, tokenId = '', tokensymbol = '') {
        $scope.tx.sendMode = sendMode;
        $scope.unitReadable = '';
        if ( globalFuncs.urlGet('tokensymbol') != null ) {
            $scope.unitReadable = $scope.tx.tokensymbol;
            $scope.tx.sendMode = 'token';
        } else if (sendMode == 'ether') {
            $scope.unitReadable = ajaxReq.type;
        } else {
            $scope.unitReadable = tokensymbol;
            $scope.tokenTx.id = tokenId;
        }
        $scope.dropdownAmount = false;
    }

    var applyScope = function() {
        if (!$scope.$$phase) $scope.$apply();
    }

    var defaultInit = function() {
        globalFuncs.urlGet('sendMode') == null ? $scope.setSendMode('ether') : $scope.setSendMode(globalFuncs.urlGet('sendMode'));
        $scope.gasLimitChanged = globalFuncs.urlGet('gaslimit') != null ? true : false;
        $scope.showAdvance = globalFuncs.urlGet('gaslimit') != null || globalFuncs.urlGet('gas') != null || globalFuncs.urlGet('data') != null;
        if (globalFuncs.urlGet('data') || globalFuncs.urlGet('value') || globalFuncs.urlGet('to') || globalFuncs.urlGet('gaslimit') || globalFuncs.urlGet('sendMode') || globalFuncs.urlGet('gas') || globalFuncs.urlGet('tokensymbol')) $scope.hasQueryString = true // if there is a query string, show an warning at top of page

    }

    var setAllTokens = function(data) {
        $scope.allTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    };

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return;
        $scope.wallet = walletService.wallet;
<<<<<<< HEAD
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
=======
        libreService.methods.getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
>>>>>>> dev
        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
        $scope.tx.to = bankAddress; //walletService.wallet.getAddressString();//$scope.wallet.setTokens();
        if ($scope.parentTxConfig) {
            var setTxObj = function() {
                $scope.addressDrtv.ensAddressField = $scope.parentTxConfig.to;
                $scope.tx.value = $scope.parentTxConfig.value;
                $scope.tx.sendMode = 'ether';
 //               $scope.tx.tokensymbol = $scope.parentTxConfig.tokensymbol ? $scope.parentTxConfig.tokensymbol : '';
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
        //$scope.setTokenSendMode();
        defaultInit();
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.setSendMode('ether');
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.$watch('tx', function(newValue, oldValue) {
        $rootScope.rootScopeShowRawTx = false;
        $scope.tx.rateLimitReal = Math.round($scope.tx.rateLimit * rateMultiplier);
        if (newValue.sendMode == 'ether') {
            $scope.tx.data = globalFuncs.urlGet('data') == null ? "" : globalFuncs.urlGet('data');
        }
        if ($scope.tx.sendMode == 'token') {
            $scope.tokenTx.to = $scope.tx.to;
            $scope.tokenTx.value = $scope.tx.value;
        }
        if (newValue.to !== oldValue.to) {
            for (var i in $scope.customGas) {
                if ($scope.tx.to.toLowerCase() == $scope.customGas[i].to.toLowerCase()) {
                    $scope.customGasMsg = $scope.customGas[i].msg != '' ? $scope.customGas[i].msg : ''
                    return;
                }
            }
            $scope.customGasMsg = ''
        }
    }, true);

    var isEnough = function(valA, valB) {
        return new BigNumber(valA).lte(new BigNumber(valB));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    var processBuyRate = function(data) {
        $scope.buyRate = data.error ? data.message : normalizeRate(data.data[0]);
        $scope.tx.rateLimit = data.error ? 0 : normalizeRate(data.data[0] * 1.1); // -10%
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

    function updateContractData() {
        getBankDataProcess("contractState", function(data) {
            $scope.bankState = getStateName(data);
        });

        // todo разместить куда-нибудь и протестировать
        Promise.all([
            getBankDataAsync("timeUpdateRequest"),
            getBankDataAsync("queuePeriod")
        ]).then(values => {
            //$scope.now = (+new Date) / 1000; // todo взять из блока
            let _timeUpdateRequest = values[0],
                _queuePeriod = values[1];
            $scope.queuePeriod = _queuePeriod;
            $scope.then = +_timeUpdateRequest.data[0] + +_queuePeriod.data[0];
            $scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
        });

        getBankDataProcess("cryptoFiatRateBuy", processBuyRate);
    }
    updateContractData();

    async function statusAllowsOrders(callback) {
        ajaxReq.getLatestBlockData(async function(data) {
            var lastBlockTime = parseInt(data.data.timestamp, 16);
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

    $scope.generateBuyLibreTx = function() {
        statusAllowsOrders(callbackBuyLibreTx);
    }

    var callbackBuyLibreTx = function() {
        $scope.buyPending = true;
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error) {
                        $scope.buyPending = false;
                        $scope.notifier.danger(data.msg);
                        return;
                    }

                    $scope.tx.data = getDataString(bankAbiRefactor["createBuyOrder"], 
                        [$scope.wallet.getAddressString(), $scope.tx.rateLimitReal]);
                    var txData = uiFuncs.getTxData($scope);
                    txData.gasLimit = gasEmission;
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
                                $scope.buyPending = false;
                                $scope.notifier.danger(resp.error);
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
                                if (!$scope.buyPending) {
                                    clearInterval(checkingTx);
                                    return;
                                }
                                if (isCheckingTx) return; // fixing doubling success messages
                                isCheckingTx = true;
                                ajaxReq.getTransactionReceipt(resp.data, async (receipt) => {
                                    if (receipt.error) {
                                        $scope.notifier.danger(receipt.msg);
                                        $scope.buyPending = false;
                                    } else {
                                        if (receipt.data != null) {
                                            let status = receipt.data.status;
                                            if (status == "0x1") {
                                                $scope.notifier.success(await $translate("LIBREBUY_txOk"), 0);
                                                updateContractData();
                                            } else {
                                                $scope.notifier.danger(await $translate("LIBREBUY_txFail"), 0);
                                            }
                                            $scope.buyPending = false;
                                        }
                                    }
                                    isCheckingTx = false;
                                });
                            }, 2000);
                        });

                        if (!$scope.$$phase) $scope.$apply();
                    });
                } catch(e) {
                    
                }

            });
        } catch (e) {
            $scope.buyPending = false;
            $scope.notifier.danger(e);
        }
    }

    $scope.transferAllBalance = function() {
        uiFuncs.transferAllBalance($scope.wallet.getAddressString(), $scope.tx.gasLimit, function(resp) {
            if (!resp.isError) {
                $scope.tx.unit = resp.unit;
                $scope.tx.value = resp.value;
            } else {
                $rootScope.rootScopeShowRawTx = false;
                $scope.notifier.danger(resp.error);
            }
        });
    }
};
module.exports = emissionCtrl;
