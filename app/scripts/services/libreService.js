/*jshint esversion: 6 */ 
"use strict";
var libreService = function(walletService, $translate) {
    var 
        exchanger = getContract("LibreExchanger"),
        cash = getContract("LibreCash");
        console.log(exchanger);
        console.log(cash);
    const 
        coeff = {
            tokenDecimals:18,
            rateMultiplier:1000,
            gasEmission:300000,
            gasRemission:300000,
            gasApprove:70000,
            gasWithdraw:100000,
            gasRUR:1000000,
            gasCR:300000,
            gasQueue:500000
        },
        states = [
            'LOCKED',
            'PROCESSING_ORDERS',
            'WAIT_ORACLES',
            'CALC_RATES',
            'REQUEST_RATES'
        ];
        

    function getDataString(func, inputs) {
        let
            fullName = ethUtil.solidityUtils.transformToFullName(func),
            funcSig = ethFuncs.getFunctionSignature(fullName),
            typeName = ethUtil.solidityUtils.extractTypeName(fullName),
            types = typeName.split(',');

            types = types[0] == "" ? [] : types;
            
        return `0x${funcSig}${ethUtil.solidityCoder.encodeParams(types, inputs)}`;
    };

    function getDataCommon(address, abiRefactored, _var, process, transactionParams, processParam) {
        return new Promise((resolve, reject) => {
            ajaxReq.getEthCall({
                from: walletService.wallet == null ? null : walletService.wallet.getAddressString(),
                to: address,
                data: getDataString(abiRefactored[_var], transactionParams)
            }, function(data) {
                if (data.error || data.data == '0x') {
                    if (data.data == '0x') {
                        data.error = true;
                        $translate("LIBRE_possibleError").then((error) => {
                            data.message = error;
                            process(data, processParam);
                        });
                    }
                } else {
                    var outTypes = abiRefactored[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                    process(data, processParam);
                }
                
            });
        });
    }

    function getDataProcess(address, abiRefactored, _var, process, params = []) {
        return getDataCommon(address, abiRefactored, _var, process, params, "");
    }

    function getContract(name){
        let
            abiList = nodes.nodeList.rin_ethscan.abiList,
            contract = abiList.find((contract) => contract.name == name),
            abi = JSON.parse(contract.abi),
            refactored = {};

        abi.forEach((item)=>refactored[item.name] = item);

        return {
            address:contract.address,
            abi:abi,
            abiRefactored:refactored
        };
    }

    function getBankDataProcess(_var, process, params = []) {
        return getDataProcess(exchanger.address, exchanger.abiRefactored, _var, process, params);
    }

    function getCashDataProcess(_var, process, params = []) {
        return getDataProcess(cash.address, cash.abiRefactored, _var, process, params);
    }

    function getDataAsync(address, abiRefactored, _var, params = []) {
        return new Promise((resolve, reject) => { 
            ajaxReq.getEthCall({
                from: walletService.wallet == null ? null : walletService.wallet.getAddressString(),
                to: address,
                data: getDataString(abiRefactored[_var], params)
            }, function(data) {
                data.varName = _var;
                if (!data.error && data.data != '0x') {
                    var outTypes = abiRefactored[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                data.params = params;
                resolve(data);
            });
        });
    }

    function getBankDataAsync(_var, params = []) {
        return getDataAsync(exchanger.address, exchanger.abiRefactored, _var, params);
    }

    function getCashDataAsync(_var, params = []) {
        return getDataAsync(cash.address, cash.abiRefactored, _var, params);
    }

    function setScope(_scope, _value, _key) {
        _scope[_key] = _value.data[0];
    }

    function getDataScope(_scope, address, abiRefactored, _var, _key, params = []) {
        return getDataCommon(_scope, address, abiRefactored, _var, setScope, params, _key);
    }

    function getBankDataScope(_scope, _var, _key, params = []) {
        return getDataScope(_scope, exchanger.address, exchanger.abiRefactored, _var, _key, params);
    }

    function getCashDataScope(_scope, _var, _key, params = []) {
        return getDataScope(_scope, cash.address, cash.abiRefactored, _var, _key, params);
    }

    function normalizeUnixTime (timestamp) {
        let date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    function normalizeRate (bigNumber) {
        return bigNumber / coeff.rateMultiplier;
    }

    function hexToString(_hex) {
        var hex = _hex.toString();//force conversion
        var str = '';
        for (var i = 2; i < hex.length; i += 2) {
            if (hex.substr(i, 2) !== "00") {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
        }
        return str;
    }

    function getStateName (number) { 
        try {
            return states[number];
        } catch(e) {
            return e.message;
        }
    }

    function fillStateData(source) { 
        try {
            var stateName = getStateName(source.data[0]);
            source.data.push(stateName);
            return source;
        } catch(e) {
            return {error: true, message: e.message};
        }
    }

    function libreTransaction (_scope, pendingVarName, opPrefix, translator, updater) {
        _scope[pendingVarName] = true;
        if (_scope.wallet == null) throw globalFuncs.errorMsgs[3];
        else if (!globalFuncs.isNumeric(_scope.tx.gasLimit) || parseFloat(_scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
        ajaxReq.getTransactionData(_scope.wallet.getAddressString(), function(data) {
            try {
                if (data.error) {
                    throw("getTransactionData: " + data.msg);
                }
                var txData = uiFuncs.getTxData(_scope);
                console.log(txData);
                uiFuncs.generateTx(txData, function(rawTx) {
                    if (rawTx.isError) {
                        _scope[pendingVarName] = false;
                        _scope.notifier.danger("generateTx: " + rawTx.error);
                        return;
                    }
                    _scope.rawTx = rawTx.rawTx;
                    _scope.signedTx = rawTx.signedTx;
                    uiFuncs.sendTx(_scope.signedTx, function(resp) {
                        if (resp.isError) {
                            _scope[pendingVarName] = false;
                            _scope.notifier.danger("sendTx: " + resp.error);
                            return;
                        }
                        var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                        var txHashLink = _scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                        var verifyTxBtn = _scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                        var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                        var completeMsg = '<p>' + globalFuncs.successMsgs[2] + '<strong>' + resp.data + '</strong></p><p>' + verifyTxBtn + ' ' + checkTxBtn + '</p>';
                        _scope.notifier.success(completeMsg, 0);
                        
                        _scope.wallet.setBalance(function() {
                            if (!_scope.$$phase) _scope.$apply();
                        });

                        var isCheckingTx = false,
                        checkingTx = setInterval(() => {
                            if (!_scope[pendingVarName]) {
                                clearInterval(checkingTx);
                                return;
                            }
                            if (isCheckingTx) return; // fixing doubling success messages
                            isCheckingTx = true;
                            ajaxReq.getTransactionReceipt(resp.data, (receipt) => {
                                if (receipt.error) {
                                    _scope[pendingVarName] = false;
                                    _scope.notifier.danger(receipt.msg);
                                } else {
                                    if (receipt.data == null) {
                                        isCheckingTx = false;
                                        return; // next interval
                                    }
                                    _scope[pendingVarName] = false;
                                    if (receipt.data.status == "0x1") { 
                                        translator(`LIBRE${opPrefix}_txOk`).then((msg) => {
                                            _scope.notifier.success(msg, 0);
                                        });
                                        updater();
                                    } else {
                                        translator(`LIBRE${opPrefix}_txFail`).then((msg) => {
                                            _scope.notifier.danger(msg, 0);
                                        });
                                    }
                                    _scope[pendingVarName] = false;
                                }
                                isCheckingTx = false;
                            });
                        }, 2000);
                    });
                });
            } catch (e) {
                _scope[pendingVarName] = false;
                _scope.notifier.danger("getTransactionData: " + e);
            }
        });
    }

    function statusAllowsOrders(_scope, transactionFunc) {
        ajaxReq.getLatestBlockData(function(blockData) {
            var lastBlockTime = parseInt(blockData.data.timestamp, 16);
            Promise.all([
                getBankDataAsync("timeUpdateRequest"),
                getBankDataAsync("queuePeriod"),
                getBankDataAsync("contractState"),
                getBankDataAsync("paused")
            ]).then((values) => {
                let _timeUpdateRequest = values[0],
                    _queuePeriod = values[1],
                    _contractState = values[2],
                    _paused = values[3].data[0];
                _scope.queuePeriod = _queuePeriod;
                _scope.then = +_timeUpdateRequest.data[0] + (+_queuePeriod.data[0]);
                _scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
                var lastedTime = +lastBlockTime - +_timeUpdateRequest.data[0];
                // allowing orders condition:
                // state == ORDER_CREATION (3) || lastedTime >= _queuePeriod
                if ((_contractState.error) && (_queuePeriod.error)) {
                    $translate("LIBRE_gettingDataError").then((msg) => {
                        _scope.notifier.danger(msg, 0);
                    });
                    return;
                }
                var allowedState = (!_paused) && ((_contractState.data[0] == 3) || (lastedTime >= _queuePeriod.data[0]));
                if (allowedState)
                    transactionFunc();                
                else {
                    $translate("LIBRE_orderNotAllowed").then((msg) => {
                        _scope.notifier.danger(msg);
                    });
                }
            });
        });
    }

    function ifAllowedRUR(_scope, transactionFunc) {
        ajaxReq.getLatestBlockData(function(blockData) {
            var lastBlockTime = parseInt(blockData.data.timestamp, 16);
            Promise.all([
                getBankDataAsync("timeUpdateRequest"),
                getBankDataAsync("relevancePeriod"),
                getBankDataAsync("contractState"),
                getBankDataAsync("paused"),
                getBankDataAsync("getOracleDeficit")
            ]).then((values) => {
                let _timeUpdateRequest = values[0],
                    _relevancePeriod = values[1],
                    _contractState = values[2],
                    _paused = values[3].data[0],
                    _oracleDeficit = values[4];
                _scope.relevancePeriod = _relevancePeriod;
                _scope.then = +_timeUpdateRequest.data[0] + (+_relevancePeriod.data[0]);
                _scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
                var lastedTime = +lastBlockTime - +_timeUpdateRequest.data[0];
                // allowing RUR:
                // state == REQUEST_UPDATE_RATES (0) || lastedTime >= _relevancePeriod
                if ((_contractState.error) || (_relevancePeriod.error) || (_oracleDeficit.error)) {
                    $translate("LIBRE_gettingDataError").then((msg) => {
                        _scope.notifier.danger(msg);
                        return;
                    });
                }
                var allowedState = (!_paused) && ((_contractState.data[0] == 0) || (lastedTime >= _relevancePeriod.data[0]));
                if (allowedState) {
                    transactionFunc(_oracleDeficit.data[0]);           
                } else {
                    $translate("LIBRE_RURNotAllowed").then((msg) => {
                        _scope.notifier.danger(msg);
                    });
                }
            });
        });
    }

    function ifAllowedQueue(_scope, transactionFunc, numOrders) {
        ajaxReq.getLatestBlockData(function(blockData) {
            var lastBlockTime = parseInt(blockData.data.timestamp, 16);
            Promise.all([
                getBankDataAsync("timeUpdateRequest"),
                getBankDataAsync("queuePeriod"),
                getBankDataAsync("contractState"),
                getBankDataAsync("paused"),
                getBankDataAsync("getOracleDeficit")
            ]).then((values) => {
                let _timeUpdateRequest = values[0],
                    _queuePeriod = values[1],
                    _contractState = values[2],
                    _paused = values[3].data[0],
                    _oracleDeficit = values[4];
                _scope.queuePeriod = _queuePeriod;
                _scope.then = +_timeUpdateRequest.data[0] + (+_queuePeriod.data[0]);
                _scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
                var lastedTime = +lastBlockTime - +_timeUpdateRequest.data[0];
                // allowing queues:
                // state == REQUEST_UPDATE_RATES (2) && lastedTime < _queuePeriod
                if ((_contractState.error) || (_queuePeriod.error)) {
                    $translate("LIBRE_gettingDataError").then((msg) => {
                        _scope.notifier.danger(msg);
                        return;
                    });
                }
                var allowedState = (!_paused) && ((_contractState.data[0] == 2) && (lastedTime < _queuePeriod.data[0]));
                if (allowedState) {
                    transactionFunc(numOrders);           
                } else {
                    $translate("LIBRE_QueueNotAllowed").then((msg) => {
                        _scope.notifier.danger(msg);
                    });
                }
            });
        });
    }    

    function ifAllowedCR(_scope, transactionFunc) {
        const MIN_READY_ORACLES = 2;
        ajaxReq.getLatestBlockData(function(blockData) {
            var lastBlockTime = parseInt(blockData.data.timestamp, 16);
            Promise.all([
                getBankDataAsync("contractState"),
                getBankDataAsync("paused"),
                getBankDataAsync("numReadyOracles"),
                getBankDataAsync("numEnabledOracles"),
                getBankDataAsync("timeUpdateRequest")
            ]).then((values) => {
                let _contractState = values[0],
                    _paused = values[1].data[0],
                    _readyOracles = values[2],
                    _enabledOracles = values[3],
                    _timeUpdateRequest = values[4];

                // allowing CR:
                // state == CALC_RATES (1)
                if ((_contractState.error) || (_readyOracles.error)) {
                    $translate("LIBRE_gettingDataError").then((msg) => {
                        _scope.notifier.danger(msg);
                        return;
                    });
                }
                var lastedTime = +lastBlockTime - +_timeUpdateRequest.data[0];
                var allowedState = (!_paused) && (_contractState.data[0] == 1) && (
                    (+_readyOracles.data[0] == +_enabledOracles.data[0]) ||
                    (+_readyOracles.data[0] >= MIN_READY_ORACLES && lastedTime >= 10 * 60) // 10 minutes to wait for oracles
                );
                if (allowedState) {
                    transactionFunc();           
                } else {
                    $translate("LIBRE_CRNotAllowed").then((msg) => {
                        _scope.notifier.danger(msg);
                    });
                }
            });
        });
    }

    function ifNotPaused(_scope, transactionFunc) {
        getBankDataAsync("paused").then((value) => {
            if (value.error) {
                $translate("LIBRE_gettingDataError").then((msg) => {
                    _scope.notifier.danger(msg);
                });
                return;
            }
            var _paused = value.data[0];
            if (!_paused)
                transactionFunc();                
            else {
                $translate("LIBRE_bankPaused").then((msg) => {
                    _scope.notifier.danger(msg);
                });
            }
        });
    }
    
    function normalizeUnixTimeObject(obj) {
        try {
            var _time = normalizeUnixTime(obj.data[0]);
            obj.data.push(_time);
            return obj;
        } catch(e) {
            return {error: true, message: e.message};
        }
    }

    return {
        bank: {
            address: exchanger.address,
            abi: exchanger.abiRefactored
        },
        token: {
            address: cash.address,
            abi: cash.abiRefactored
        },
        coeff:coeff,
        methods: {
            getDataString: getDataString,
            getBankDataProcess: getBankDataProcess,
            getCashDataProcess: getCashDataProcess,
            getBankDataAsync: getBankDataAsync,
            getCashDataAsync: getCashDataAsync,
            getBankDataScope: getBankDataScope,
            getCashDataScope: getCashDataScope,
            normalizeUnixTime: normalizeUnixTime,
            normalizeUnixTimeObject: normalizeUnixTimeObject,
            normalizeRate: normalizeRate,
            hexToString: hexToString,
            getStateName: getStateName,
            fillStateData: fillStateData,
            libreTransaction: libreTransaction,
            statusAllowsOrders: statusAllowsOrders,
            ifNotPaused: ifNotPaused,
            ifAllowedRUR: ifAllowedRUR,
            ifAllowedCR: ifAllowedCR,
            ifAllowedQueue: ifAllowedQueue
        },
        networkType: "rinkeby"
    };
};
module.exports = libreService;