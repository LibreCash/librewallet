'use strict';
var emissionCtrl = async function($scope, $sce, walletService, libreService, $rootScope) {
    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType)
        $scope.notifier.danger("Contract work only in rinkeby network!!");

    var libreBank = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreBank");
    var bankAddress = libreBank.address;
    var bankAbi = libreBank.abi;
    var bankAbiRefactor = {};
    for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];

    const rateMultiplier = 1000; // todo перенести
    const tokenMultiplier = Math.pow(10, 18); // todo перенести

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
    $scope.dropdownEnabled = false;
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
    const GAS_EMISSION = 300000;

    $scope.customGas = CustomGasMessages;

    $scope.tx = {
        // if there is no gasLimit or gas key in the URI, use the default value. Otherwise use value of gas or gasLimit. gasLimit wins over gas if both present
        gasLimit: GAS_EMISSION, //globalFuncs.urlGet('gaslimit') != null || globalFuncs.urlGet('gas') != null ? globalFuncs.urlGet('gaslimit') != null ? globalFuncs.urlGet('gaslimit') : globalFuncs.urlGet('gas') : globalFuncs.defaultTxGasLimit,
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
    };

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return;
        $scope.wallet = walletService.wallet;
        libreService.methods.getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
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

    var normalise = function(name) {
        try {
            return uts46.toUnicode(name, { useStd3ASCII: true, transitional: false });
        } catch (e) {
            throw e;
        }
    };
    var getDataString = function(func, inputs) {
        var fullFuncName = ethUtil.solidityUtils.transformToFullName(func);
        var funcSig = ethFuncs.getFunctionSignature(fullFuncName);
        var typeName = ethUtil.solidityUtils.extractTypeName(fullFuncName);
        var types = typeName.split(',');
        types = types[0] == "" ? [] : types;
        return '0x' + funcSig + ethUtil.solidityCoder.encodeParams(types, inputs);
    };

    function getBankDataProcess(_var, process, param = "") {
        return new Promise((resolve, reject) => { 
            ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[_var], [param]) }, function(data) {
                if (data.error || data.data == '0x') {
                    if (data.data == '0x') {
                        data.error = true;
                        data.message = "Possible error with network or the bank contract";
                    }
                } else {
                    var outTypes = bankAbiRefactor[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                process(data);
            });
        })
    }

    async function getBankDataAsync(_var, param = "") {
        return new Promise((resolve, reject) => { 
            ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[_var], [param]) }, function(data) {
                if (data.error || data.data == '0x') {
                    if (data.data == '0x') {
                        data.error = true;
                        data.message = "Possible error with network or the bank contract";
                    }
                } else {
                    var outTypes = bankAbiRefactor[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                resolve(data);
            });
        })
    }

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
    processBuyRate = function(data) {
        $scope.buyRate = data.error ? data.message : normalizeRate(data.data[0]);
        $scope.tx.rateLimit = data.error ? 0 : normalizeRate(data.data[0] * 1.1); // -10%
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

    function updateContractData() {
        getBankDataProcess("contractState", function(data) {
            $scope.bankState = states(data);
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
        try {
            if ($scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric($scope.tx.gasLimit) || parseFloat($scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData($scope.wallet.getAddressString(), function(data) {
                if (data.error) $scope.notifier.danger(data.msg);

                $scope.tx.data = getDataString(bankAbiRefactor["createBuyOrder"], 
                    [$scope.wallet.getAddressString(), $scope.tx.rateLimitReal]);
                var txData = uiFuncs.getTxData($scope);
                txData.gasLimit = GAS_EMISSION;
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
                                $scope.buyPending = true;
                            
                                var isCheckingTx = false,
                                checkingTx = setInterval(() => {
                                    if (!$scope.buyPending) {
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
                                                $scope.buyPending = false;
                                            } else {
                                                if (receipt.data != null) {
                                                    let status = receipt.data.status;
                                                    if (status == "0x1") {
                                                        $scope.notifier.success("Buy ok! todo translate", 0);
                                                        updateContractData();
                                                    } else {
                                                        $scope.notifier.danger("Buy tx fail! todo translate and txid here", 0);
                                                    }
                                                    $scope.buyPending = false;
                                                }
                                            }
                                            isCheckingTx = false;
                                        }
                                    );
                                }, 2000);
                            } else {
                                $scope.notifier.danger(resp.error);
                            }
                        });
                    } else {
                        $scope.notifier.danger(rawTx.error);
                    }
                    if (!$scope.$$phase) $scope.$apply();
                });
            });
        } catch (e) {
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
