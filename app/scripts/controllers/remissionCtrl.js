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
        getDataString = libreService.methods.getDataString;

    var states = function(_data) { 
        const _states = ['REQUEST_UPDATE_RATES', 'CALC_RATE', 'PROCESS_ORDERS', 'ORDER_CREATION'];
        try {
            var stateName = _states[_data.data[0]];
            _data.data.push(stateName);
            return _data;
        } catch(e) {
            return {error: true, message: e.message};
        }
    },
    normalizeRate = function(data) {
        return data / rateMultiplier;
    },
    processSellRate = function(data) {
        $scope.sellRate = data.error ? data.message : normalizeRate(data.data[0]);
        $scope.tx.rateLimit = data.error ? 0 : normalizeRate(data.data[0] * 0.9); // +10%
    },
    processTokenCount = function(data) {
        $scope.tokenCount = data.error ? data.message : normalizeRate(data.data[0]);
    },
    normalizeUnixTime = function(data) {
        var date = new Date(data * 1000);
        return date.toLocaleString();
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

    var libreBank = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreBank");
    var bankAddress = libreBank.address;
    var bankAbi = libreBank.abi;
    var bankAbiRefactor = {};    
    for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];

    var libreCash = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreCash");
    var cashAddress = libreCash.address;
        $scope.cashAddress = cashAddress;
    var cashAbi = libreCash.abi;
    var cashAbiRefactor = {};    
    for (var i = 0; i < cashAbi.length; i++) cashAbiRefactor[cashAbi[i].name] = cashAbi[i];


    const rateMultiplier = 1000; // todo перенести

    //$scope.buy = true; // activate buy tab
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
    $scope.dropdownEnabled = true;
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
    const GAS_REMISSION = 300000,
          GAS_APPROVAL = 70000,
          GAS_WITHDRAW = 100000;
          
    $scope.customGas = CustomGasMessages;

    $scope.tx = {
        // if there is no gasLimit or gas key in the URI, use the default value. Otherwise use value of gas or gasLimit. gasLimit wins over gas if both present
        gasLimit: GAS_REMISSION, //globalFuncs.urlGet('gaslimit') != null || globalFuncs.urlGet('gas') != null ? globalFuncs.urlGet('gaslimit') != null ? globalFuncs.urlGet('gaslimit') : globalFuncs.urlGet('gas') : globalFuncs.defaultTxGasLimit,
        data: globalFuncs.urlGet('data') == null ? "" : globalFuncs.urlGet('data'),
        to: bankAddress,
        unit: "ether",
        value: globalFuncs.urlGet('value') == null ? "" : globalFuncs.urlGet('value'),
        nonce: null,
        gasPrice: globalFuncs.urlGet('gasprice') == null ? null : globalFuncs.urlGet('gasprice'),
        donate: false,
        tokensymbol: globalFuncs.urlGet('tokensymbol') == null ? false : globalFuncs.urlGet('tokensymbol'),
        rateLimit: 0,
        rateLimitReal: 0
    }

    // todo избавиться чисто
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

    $scope.setTokenSendMode = function() {
        if ($scope.tx.sendMode == 'token' && !$scope.tx.tokensymbol) {
            $scope.tx.tokensymbol = $scope.wallet.tokenObjs[0].symbol;
            $scope.wallet.tokenObjs[0].type = "custom";
            $scope.setSendMode($scope.tx.sendMode, 0, $scope.tx.tokensymbol);
        } else if ($scope.tx.tokensymbol) {
            for (var i = 0; i < $scope.wallet.tokenObjs.length; i++) {
                if ($scope.wallet.tokenObjs[i].symbol.toLowerCase().indexOf($scope.tx.tokensymbol.toLowerCase()) !== -1) {
                    $scope.wallet.tokenObjs[i].type = "custom";
                    $scope.setSendMode('token', i, $scope.wallet.tokenObjs[i].symbol);
                    break;
                } else $scope.tokenTx.id = -1;
            }
        }
        if ($scope.tx.sendMode != 'token') $scope.tokenTx.id = -1;
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
    }, 
    setAllowance = function(data) {
        //console.log("allowance", data);
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
        $scope.tx.to = bankAddress; //walletService.wallet.getAddressString();//$scope.wallet.setTokens();
        $scope.tx.value = 0;
        if ($scope.parentTxConfig) {
            var setTxObj = function() {
                $scope.addressDrtv.ensAddressField = $scope.parentTxConfig.to;
                $scope.tx.value = 0;
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
        $scope.setTokenSendMode();
        defaultInit();
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.setSendMode('ether');
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.$watch('tokenTx', function() {
        if ($scope.wallet && $scope.wallet.tokenObjs !== undefined && $scope.wallet.tokenObjs[$scope.tokenTx.id] !== undefined && $scope.Validator.isValidAddress($scope.tokenTx.to) && $scope.Validator.isPositiveNumber($scope.tokenTx.value)) {
            if ($scope.estimateTimer) clearTimeout($scope.estimateTimer);
        }
    }, true);

    $scope.$watch('tx', function(newValue, oldValue) {
        $rootScope.rootScopeShowRawTx = false;
        updateContractData();
        $scope.tx.rateLimitReal = Math.round($scope.tx.rateLimit * rateMultiplier);
        if (newValue.sendMode == 'ether') {
            $scope.tx.data = globalFuncs.urlGet('data') == null ? "" : globalFuncs.urlGet('data');
        }
        if (newValue.gasLimit == oldValue.gasLimit && $scope.wallet && 
                        $scope.Validator.isValidAddress($scope.tx.to) && 
                        $scope.Validator.isPositiveNumber($scope.tx.value) && 
                        $scope.Validator.isValidHex($scope.tx.data) &&
                        $scope.tx.sendMode != 'token') {
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

    var normalise = function(name) {
        try {
            return uts46.toUnicode(name, { useStd3ASCII: true, transitional: false });
        } catch (e) {
            throw e;
        }
    };




    function updateContractData() {
        if (walletService.wallet != null) {
            updateBalanceAndAllowance();
            getBankDataProcess("getBalanceEther", function(data) {
                $scope.getBalance = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
            });
        }
        getBankDataProcess("contractState", function(data) {
            $scope.bankState = states(data);
        });

        getBankDataProcess("cryptoFiatRateSell", processSellRate);
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
        $scope.approvePending = true;
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            // first we recheck current approved tokens
            var allowanceData = await getCashDataAsync("allowance", [walletService.wallet.getAddressString(), bankAddress]);
            if (allowanceData.error)
                throw(allowanceData.msg);
            var allowance = +allowanceData.data[0];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error) {
                        throw(data.msg);
                    }
                    var tokensToAllowCount = $scope.tokensToAllow * Math.pow(10, libreService.coeff.tokenDecimals);
                    if (allowance == tokensToAllowCount) {
                        throw("Allowance is equal to the value you want to set");
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
                    
                    var txData = uiFuncs.getTxData($scope);
                    txData.to = cashAddress;
                    txData.gasLimit = GAS_APPROVAL;
                    uiFuncs.generateTx(txData, function(rawTx) {
                        if (!rawTx.isError) {
                            $scope.rawTx = rawTx.rawTx;
                            $scope.signedTx = rawTx.signedTx;
                            uiFuncs.sendTx($scope.signedTx, function(resp) {
                                if (!resp.isError) {
                                    var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                                    var txHashLink = $scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                                    var emailBody = 'I%20was%20trying%20to..............%0A%0A%0A%0ABut%20I%27m%20confused%20because...............%0A%0A%0A%0A%0A%0ATo%20Address%3A%20https%3A%2F%2Fetherscan.io%2Faddress%2F' + $scope.tx.to + '%0AFrom%20Address%3A%20https%3A%2F%2Fetherscan.io%2Faddress%2F' + $scope.wallet.getAddressString() + '%0ATX%20Hash%3A%20https%3A%2F%2Fetherscan.io%2Ftx%2F' + resp.data + '%0AAmount%3A%20' + $scope.tx.value + '%20' + $scope.unitReadable + '%0ANode%3A%20' + $scope.ajaxReq.type + '%0AToken%20To%20Addr%3A%20' + $scope.tokenTx.to + '%0AToken%20Amount%3A%20' + $scope.tokenTx.value + '%20' + $scope.unitReadable + '%0AData%3A%20' + $scope.tx.data + '%0AGas%20Limit%3A%20' + $scope.tx.gasLimit + '%0AGas%20Price%3A%20' + $scope.tx.gasPrice;
                                    var verifyTxBtn = $scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                                    var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                                    var emailBtn = '<a class="btn btn-xs btn-info " href="mailto:support@myetherwallet.com?Subject=Issue%20regarding%20my%20TX%20&Body=' + emailBody + '" target="_blank" rel="noopener noreferrer">Confused? Email Us.</a>';
                                    var completeMsg = '<p>' + globalFuncs.successMsgs[2] + '<strong>' + resp.data + '</strong></p><p>' + verifyTxBtn + ' ' + checkTxBtn + '</p>';
                                    $scope.notifier.success(completeMsg, 0);
                                    $scope.wallet.setBalance(applyScope);
                                
                                    var isCheckingTx = false,
                                        checkingTx = setInterval(() => {
                                            if (!$scope.approvePending) {
                                                clearInterval(checkingTx);
                                                return;
                                            }
                                            if (isCheckingTx) return; // fixing doubling success messages
                                            isCheckingTx = true;
                                            ajaxReq.getTransactionReceipt(
                                                resp.data,
                                                (receipt) => {
                                                    if (receipt.error) {
                                                        $scope.notifier.danger(receipt.msg);
                                                        $scope.approvePending = false;
                                                    } else {
                                                        if (receipt.data != null) {
                                                            let status = receipt.data.status;
                                                            if (status == "0x1") {
                                                                $scope.notifier.success("Approve ok! todo translate", 0);
                                                                updateContractData();
                                                            } else {
                                                                $scope.notifier.danger("Approve tx fail! todo translate and txid here", 0);
                                                            }
                                                            $scope.approvePending = false;
                                                        }
                                                    }
                                                    isCheckingTx = false;
                                                } // callback function when got receipt
                                            ); // getTransactionReceipt async
                                        }, 2000); // setInterval
                                    } else {
                                        $scope.notifier.danger(resp.error);
                                    }

                            });
                        }
                    });
                } catch(e) {
                    $scope.notifier.danger(e);
                    $scope.approvePending = false;
                }
            });
        } catch (e) {
            $scope.notifier.danger(e);
            $scope.approvePending = false;
        }
    }

    $scope.generateSellLibreTx = function() {
        statusAllowsOrders(callbackSellLibreTx);
    }

    //console.log(await $translate("SUCCESS_1"));

    var callbackSellLibreTx = function() {
        $scope.sellPending = true;
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error)
                        throw(data.msg);
                    var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals);
                    $scope.tx.data = getDataString(bankAbiRefactor["createSellOrder"], 
                        [$scope.wallet.getAddressString(), tokenCount, $scope.tx.rateLimitReal]);
                    var txData = uiFuncs.getTxData($scope);
                    txData.gasLimit = GAS_REMISSION;
                    uiFuncs.generateTx(txData, function(rawTx) {
                        if (!rawTx.isError) {
                            $scope.rawTx = rawTx.rawTx;
                            $scope.signedTx = rawTx.signedTx;
                            uiFuncs.sendTx($scope.signedTx, function(resp) {
                                if (!resp.isError) {
                                    var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                                    var txHashLink = $scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                                    var emailBody = 'I%20was%20trying%20to..............%0A%0A%0A%0ABut%20I%27m%20confused%20because...............%0A%0A%0A%0A%0A%0ATo%20Address%3A%20https%3A%2F%2Fetherscan.io%2Faddress%2F' + $scope.tx.to + '%0AFrom%20Address%3A%20https%3A%2F%2Fetherscan.io%2Faddress%2F' + $scope.wallet.getAddressString() + '%0ATX%20Hash%3A%20https%3A%2F%2Fetherscan.io%2Ftx%2F' + resp.data + '%0AAmount%3A%20' + $scope.tx.value + '%20' + $scope.unitReadable + '%0ANode%3A%20' + $scope.ajaxReq.type + '%0AToken%20To%20Addr%3A%20' + $scope.tokenTx.to + '%0AToken%20Amount%3A%20' + $scope.tokenTx.value + '%20' + $scope.unitReadable + '%0AData%3A%20' + $scope.tx.data + '%0AGas%20Limit%3A%20' + $scope.tx.gasLimit + '%0AGas%20Price%3A%20' + $scope.tx.gasPrice;
                                    var verifyTxBtn = $scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                                    var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                                    var emailBtn = '<a class="btn btn-xs btn-info " href="mailto:support@myetherwallet.com?Subject=Issue%20regarding%20my%20TX%20&Body=' + emailBody + '" target="_blank" rel="noopener noreferrer">Confused? Email Us.</a>';
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
                                        ajaxReq.getTransactionReceipt(
                                            resp.data,
                                            (receipt) => {
                                                if (receipt.error) {
                                                    $scope.notifier.danger(receipt.msg);
                                                    $scope.sellPending = false;
                                                } else {
                                                    if (receipt.data != null) {
                                                        let status = receipt.data.status;
                                                        if (status == "0x1") {
                                                            $scope.notifier.success("Sell ok! todo translate", 0);
                                                            updateContractData();
                                                        } else {
                                                            $scope.notifier.danger("Sell tx fail! todo translate and txid here", 0);
                                                        }
                                                        $scope.sellPending = false;
                                                    }
                                                }
                                                isCheckingTx = false;
                                            }
                                        );
                                    }, 2000);
                                } else {
                                    $scope.notifier.danger(resp.error);
                                    $scope.sellPending = false;
                                }
                            });
                        }
                    });
                } catch (e) {
                    $scope.notifier.danger(e);
                    $scope.sellPending = false;
                }
            }); // getTransactionData
        } catch (e) {
            $scope.notifier.danger(e);
            $scope.sellPending = false;
        }
    }

    $scope.generateWithdrawLibreTx = function() {
        ifNotPaused(callbackWithdrawLibreTx);
    }

    var callbackWithdrawLibreTx = function() {
        $scope.withdrawPending = true;
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error) $scope.notifier.danger(data.msg);
                    $scope.tx.data = getDataString(bankAbiRefactor["getEther"], []);
                    $scope.gasLimit = GAS_WITHDRAW;
                    var txData = uiFuncs.getTxData($scope);

                    uiFuncs.generateTx(txData, function(rawTx) {
                        if (!rawTx.isError) {
                            $scope.rawTx = rawTx.rawTx;
                            $scope.signedTx = rawTx.signedTx;
                            uiFuncs.sendTx($scope.signedTx, function(resp) {
                                if (!resp.isError) {
                                    var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                                    var txHashLink = $scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                                    var emailBody = 'I%20was%20trying%20to..............%0A%0A%0A%0ABut%20I%27m%20confused%20because...............%0A%0A%0A%0A%0A%0ATo%20Address%3A%20https%3A%2F%2Fetherscan.io%2Faddress%2F' + $scope.tx.to + '%0AFrom%20Address%3A%20https%3A%2F%2Fetherscan.io%2Faddress%2F' + $scope.wallet.getAddressString() + '%0ATX%20Hash%3A%20https%3A%2F%2Fetherscan.io%2Ftx%2F' + resp.data + '%0AAmount%3A%20' + $scope.tx.value + '%20' + $scope.unitReadable + '%0ANode%3A%20' + $scope.ajaxReq.type + '%0AToken%20To%20Addr%3A%20' + $scope.tokenTx.to + '%0AToken%20Amount%3A%20' + $scope.tokenTx.value + '%20' + $scope.unitReadable + '%0AData%3A%20' + $scope.tx.data + '%0AGas%20Limit%3A%20' + $scope.tx.gasLimit + '%0AGas%20Price%3A%20' + $scope.tx.gasPrice;
                                    var verifyTxBtn = $scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                                    var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                                    var emailBtn = '<a class="btn btn-xs btn-info " href="mailto:support@myetherwallet.com?Subject=Issue%20regarding%20my%20TX%20&Body=' + emailBody + '" target="_blank" rel="noopener noreferrer">Confused? Email Us.</a>';
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
                                        ajaxReq.getTransactionReceipt(
                                            resp.data,
                                            (receipt) => {
                                                if (receipt.error) {
                                                    $scope.notifier.danger(receipt.msg);
                                                    $scope.withdrawPending = false;
                                                } else {
                                                    if (receipt.data != null) {
                                                        let status = receipt.data.status;
                                                        if (status == "0x1") {
                                                            $scope.notifier.success("Withdraw ok! todo translate", 0);
                                                            updateContractData();
                                                        } else {
                                                            $scope.notifier.danger("Withdraw tx fail! todo translate and txid here", 0);
                                                        }
                                                        $scope.withdrawPending = false;
                                                    }
                                                }
                                                isCheckingTx = false;
                                            }
                                        );
                                    }, 2000);
                                } else {
                                    $scope.notifier.danger(resp.error);
                                    $scope.withdrawPending = false;
                                }
                            });
                        }                
                    });
                } catch (e) {
                    $scope.notifier.danger(e);
                    $scope.withdrawPending = false;
                }
            });
        } catch (e) {
            $scope.notifier.danger(e);
            $scope.withdrawPending = false;
        }
    }
};
module.exports = remissionCtrl;
