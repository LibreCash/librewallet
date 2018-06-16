/*jshint esversion: 6 */ 
"use strict";
var libreService = function(walletService, $translate) {
    var 
        networks = {rinkeby: 'rin_ethscan', eth: 'eth_infura'};
    var 
        exchanger = getContract("LibreExchanger"),
        cash = getContract("LibreCash"),
        liberty = getContract("LibertyToken"),
        mainTimer = null,
        oracleABI = {"gasPrice":
            {"constant":true,"inputs":[],"name":"gasPrice",
            "outputs":[{"name":"","type":"uint256"}],"payable":false,
            "stateMutability":"view","type":"function"},
            "gasLimit":{"constant":true,"inputs":[],"name":"gasLimit",
            "outputs":[{"name":"","type":"uint256"}],"payable":false,
            "stateMutability":"view","type":"function"}
        };

    var 
        IS_DEBUG = false,
        states = [
            'LOCKED',
            'PROCESSING_ORDERS',
            'WAIT_ORACLES',
            'CALC_RATES',
            'REQUEST_RATES'
        ],
        statesENUM = {
            'LOCKED': 0,
            'PROCESSING_ORDERS': 1,
            'WAIT_ORACLES': 2,
            'CALC_RATES': 3,
            'REQUEST_RATES': 4
        },
        coeff = {
            tokenDecimals: 18,
            rateMultiplier: 1000,
            gasEmission: 90000,
            gasRemission: 90000,
            gasApprove: 50000,
            gasUpdateRates: 1800000,
            gasCalcRates: 260000,
            statesENUM: statesENUM,
            isDebug: IS_DEBUG,
            minReadyOracles: 2,
            oracleActual: 15 * 60,
            rateActual: 10 * 60,
            oracleTimeout: 10 * 60,
            callbackGas: {
                min: 2,
                max: 15,
                value: 3
            }
        };
        
    if (IS_DEBUG) {
        console.log("Used contracts")
        console.log(exchanger);
        console.log(cash);
    }    

    function getDataString(func, inputs) {
        let
            fullName = ethUtil.solidityUtils.transformToFullName(func),
            funcSig = ethFuncs.getFunctionSignature(fullName),
            typeName = ethUtil.solidityUtils.extractTypeName(fullName),
            types = typeName.split(',');

            types = types[0] == "" ? [] : types;
            
        return `0x${funcSig}${ethUtil.solidityCoder.encodeParams(types, inputs)}`;
    };

    function getDataCommon(to, abi, varName, process, txParam, processParam) {
        return getEthCall({
                from: walletService.wallet == null ? null 
                    : walletService.wallet.getAddressString(),
                to,
                data: getDataString(abi[varName], txParam)
            })
            .catch(()=>{
                $translate("LIBRE_possibleError").then((error) => {
                    res.error = true;
                    res.message = error;
                    process(res, processParam);
                    //TODO: use reject() here
                });
            })
            .then((res) => {
                res.data = encodeData(abi[varName],res.data);
                process(res, processParam);
                //TODO: use resolve() here
            });
    }

    function getDataProcess(to, abi, varName, process, params = []) {
        return getDataCommon(to, abi, varName, process, params, "");
    }

    function getContract(name){
        let
            _network = getNetwork(),
            abiList = nodes.nodeList[_network].abiList,
            contract = abiList.find((contract) => contract.name == name),
            abi = JSON.parse(contract.abi),
            refactored = {};

        abi.forEach((item)=>refactored[item.name] = item);

        return {
            address: contract.address,
            abi: abi,
            abiRefactored: refactored
        };
    }

    function getNetwork() {
        let networkType = globalFuncs.getDefaultTokensAndNetworkType().networkType;
        if (IS_DEBUG) console.log(~Object.keys(networks).indexOf(networkType) ? networks[networkType] : '');
        return ~Object.keys(networks).indexOf(networkType) ? networks[networkType] : '';
    }

    function getBankDataProcess(_var, process, params = []) {
        return getDataProcess(exchanger.address, exchanger.abiRefactored, _var, process, params);
    }

    function getCashDataProcess(_var, process, params = []) {
        return getDataProcess(cash.address, cash.abiRefactored, _var, process, params);
    }

    function getLBRSDataProcess(_var, process, params = []) {
        return getDataProcess(liberty.address, cash.abiRefactored, _var, process, params);
    }

    function getDataAsync(to, abi, _var, params = []) {
        if (IS_DEBUG) {
            console.log(`[CALL ${getDataString(abi[_var], params)}]`);
        }
        return getEthCall({
            from: walletService.wallet == null ? null : walletService.wallet.getAddressString(),
            data: getDataString(abi[_var], params),
            to
        })
        .then((res) => {
            res.varName = _var;
            res.data = encodeData(abi[_var],res.data);
            res.params = params;
            return res;
        })
        .catch((e) => {
            console.log(e);
            console.log(`Error on getDataAsync: ${to} ${JSON.stringify(abi)} ${_var} ${params}`);
        });
    }

    function encodeData(abi,data){
        let outTypes = abi.outputs.map((i)=> i.type);
        return ethUtil.solidityCoder.decodeParams(outTypes, data.replace('0x', ''));
    }

    function getContractData(varName, params = []) {
        return getDataAsync(exchanger.address, exchanger.abiRefactored, varName, params);
    }

    function getTokenData(_var, params = []) {
        return getDataAsync(cash.address, cash.abiRefactored, _var, params);
    }

    function setScope(_scope, _value, _key) {
        _scope[_key] = _value.data[0];
    }

    function getScope(_scope, address, abi, _var, _key, params = []) {
        return getDataCommon(_scope, address, abi, _var, setScope, params, _key);
    }

    function getContractScope(_scope, _var, _key, params = []) {
        return getScope(_scope, exchanger.address, exchanger.abiRefactored, _var, _key, params);
    }

    function getTokenScope(_scope, _var, _key, params = []) {
        return getScope(_scope, cash.address, cash.abiRefactored, _var, _key, params);
    }

    function toUnixtime(timestamp) {
        if (timestamp == 0)
            return '-'
        
        let date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    function normalizeRate(bigNumber) {
        return bigNumber / coeff.rateMultiplier;
    }

    function hexToString(_hex) {
        var 
            hex = _hex.toString(),//force conversion
            str = '';
            
        for (var i = 2; i < hex.length; i += 2) {
            if (hex.substr(i, 2) !== "00") {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
        }
        return str;
    }

    function getStateName(number) { 
        try {
            return states[number];
        } catch(e) {
            return e.message;
        }
    }

    function fillStateData(source) { 
        try {
            let stateName = getStateName(source.data[0]);
            source.data.push(stateName);
            return source;
        } catch(e) {
            return {error: true, message: e.message};
        }
    }

    function getTransactionData(addr) {
        return new Promise((resolve,reject) => {
            ajaxReq.getTransactionData(addr, (data) => {
                if(data.error) reject(data);
                resolve(data);
            });
        });
    }

    function getEstimatedGas(txData) {
        if (txData.value == "0x00") {
            txData.value = 0;
        }
        return new Promise((resolve, reject) => {
            ajaxReq.getEstimatedGas(txData, (data) => {
                if (data.error) reject(data);
                resolve(data);
            });
        });
    }

    function getLibreRawTx(_scope) {
        return new Promise((resolve, reject) => {
            if (_scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric(_scope.tx.gasLimit) || parseFloat(_scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            let userWallet = _scope.wallet.getAddressString();
            getTransactionData(userWallet).then((data) => {
                var txData = uiFuncs.getTxData(_scope);
                uiFuncs.generateTx(txData, function(rawTx) {
                    if (rawTx.isError) {
                        _scope.notifier.danger("generateTx: " + rawTx.error);
                        reject(rawTx);
                    }
                    resolve(rawTx);
                });
            });
        });    
    }

    function getTransactionReceipt(txData) {
        return new Promise((resolve, reject) => {
            ajaxReq.getTransactionReceipt(txData, (data) => {
                if (data.error) reject(data);
                resolve(data);
            });
        })
    }

    function sendTx(txData) {
        return new Promise((resolve, reject) => {
            uiFuncs.sendTx(txData, (data) => {
                if (data.error) reject(data);
                resolve(data);
            });
        })
    }

    function generateTx(txData) {
        return new Promise((resolve, reject) => {
            uiFuncs.generateTx(txData, (data) => {
                if (data.error) reject(data);
                resolve(data);
            });
        })
    }

    function TX(methodName, translator) {
        this.fail = async () => {
            this.status = await translator('LIBRE_txState_Fail')
            this.color = "red"
        }
        this.success = async () => {
            this.color = 'green';
            this.status = await translator('LIBRE_txState_Success')
        }
        this.sending = async () => {
            this.color = '#cc0';
            this.status = await translator('LIBRE_txState_Send')
        }
        this.pending = async () => {
            this.color = '#cc0';
            this.status = await translator('LIBRE_txState_Pending')
        }
        this.init = async () => {
            let time = new Date();
            this.name = await translator(`LIBRE_txName_${methodName}`)
            this.date = `${time.getHours()}:${time.getMinutes()<10?'0':''}${time.getMinutes()}`
            await this.sending()
        }
    }

    function checkMetamaskError(translator, error) {
        const METAMASK_DENY_CHROME = "User denied transaction signature";
        const METAMASK_DENY_FF = "@moz-extension";
        if (~error.indexOf(METAMASK_DENY_CHROME) || ~error.indexOf(METAMASK_DENY_FF)) {
            return translator("LIBRE_metamaskError");
        }
        return false;
    }

    async function libreTransaction(_scope, methodName, opPrefix, translator, updater) {
        var pendingName = `${methodName}Pending`;
        _scope[pendingName] = true;
        if (_scope.wallet == null) throw globalFuncs.errorMsgs[3]; // TODO: Replace to const
        else if (!globalFuncs.isNumeric(_scope.tx.gasLimit) || parseFloat(_scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
        
        var tx;
        try {
            tx = new TX(methodName, translator)
            await tx.init()

            _scope.notifier.txs.push(tx)
            let userWallet = _scope.wallet.getAddressString();
            var data = await getTransactionData(userWallet)

            var txData = uiFuncs.getTxData(_scope);
            if (IS_DEBUG) console.log(txData);
            var rawTx = await generateTx(txData)
            if (rawTx.isError) {
                await tx.fail()
                _scope.notifier.danger("generateTx: " + rawTx.error);
                _scope[pendingName] = false
                return;
            }
            _scope.rawTx = rawTx.rawTx;
            _scope.signedTx = rawTx.signedTx;

            var resp = await sendTx(_scope.signedTx)

            if (resp.isError) {
                _scope.notifier.danger("sendTx: " + resp.error);
                await tx.fail()
                _scope[pendingName] = false
                return;
            }
            var checkTxLink = `https://www.myetherwallet.com?txHash=${resp.data}#check-tx-status`;
            var txHashLink = _scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
            var verifyTxBtn = _scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
            var checkTxBtn = `<a class="btn btn-xs btn-info" href="${checkTxLink}" target="_blank" rel="noopener noreferrer"> Check TX Status </a>`;
            var completeMsg = `<p>${globalFuncs.successMsgs[2]}<strong>${resp.data}</strong></p><p>${verifyTxBtn} ${checkTxBtn}</p>`;
            _scope.notifier.success(completeMsg, 0);

            tx.hash = resp.data;
            await tx.pending()

            _scope.wallet.setBalance(function() {
                if (!_scope.$$phase) _scope.$apply();
            });
            if (IS_DEBUG) console.log("resp", resp);
            
            var isCheckingTx = false,
                noTxCounter = 0,
                receiptInterval = 5000,
                txCheckingTimeout = 1.5 * 60 * 1000;
            var checkingTx = setInterval(async () => {
                if (!_scope[pendingName]) {
                    clearInterval(checkingTx);
                    return;
                }
                if (isCheckingTx) return; // fixing doubling success messages
                isCheckingTx = true;
                try {
                    var receipt = await getTransactionReceipt(resp.data)
                } catch (e) {
                    var receipt = e
                }
                if (receipt.error) {
                    if (receipt.msg == "unknown transaction") {
                        noTxCounter++;
                        if (noTxCounter > txCheckingTimeout / receiptInterval) {
                            _scope.notifier.danger(receipt.msg, 0);
                            await tx.fail()
                            _scope[pendingName] = false
                        }
                    } else {
                        _scope.notifier.danger(`tx receipt error: ${receipt.msg}`, 0);
                        await tx.fail()
                        _scope[pendingName] = false
                    }
                } else {
                    if (receipt.data == null || receipt.data.blockNumber == null) {
                        isCheckingTx = false
                        return
                    }
                    if (receipt.data.status == "0x1") {
                        _scope.notifier.success(await translator(`LIBRE${opPrefix}_txOk`), 0);
                        await tx.success()
                        _scope[pendingName] = false
                        if (updater != null) {
                            updater();
                        }
                    } else {
                        _scope.notifier.danger(await translator(`LIBRE${opPrefix}_txFail`), 0);
                        await tx.fail()
                        _scope[pendingName] = false
                    }
                    _scope.wallet.setBalance(function() {
                        if (!_scope.$$phase) _scope.$apply();
                    });
                }
                isCheckingTx = false;
            }, receiptInterval);

            for(;_scope.notifier.txs.length > 10;) {
                _scope.notifier.txs.shift()
            }
        } catch (e) {
            _scope[pendingName] = false;
            isCheckingTx = false;
            let error = e.error || e,
                metamaskError = await checkMetamaskError(translator, error);
            console.log("metamask", metamaskError)
            _scope.notifier.danger(metamaskError || "getTransactionData: " + error, 0);
            await tx.fail();
        }
    }

    function canOrder(rates = [0, 0]) {
        return new Promise((resolve, reject) => {
            if (rates[0] == 0 && rates[1] == 0) {
                $translate("LIBRE_errorValidatingRates").then((msg) => reject(msg));
            }
            return Promise.all([
                getContractData("getState"),
                getContractData(rates[0] != 0 ? "buyRate" : "sellRate")
            ])
            .then((values) => {
                let 
                    state = values[0],
                    rate = values[1];
    
                let prevRate = rates[0] != 0 ? rates[0] : rates[1];
                if (rate.data[0] / coeff.rateMultiplier != prevRate) {
                    $translate("LIBRE_errorValidatingRates").then((msg) => reject(msg));
                }
    
                let canOrder = (+state.data[0] == statesENUM.PROCESSING_ORDERS);
                if (canOrder)
                    resolve();
                else {
                    $translate("LIBRE_orderNotAllowed").then((msg) => reject(msg));
                }
            });    
        });
    }

    function canRequest() {
        return new Promise((resolve, reject) => {
            Promise.all([
                getContractData("getState")
            ]).then((values) => {
                let 
                    state = values[0];
    
                let сanRequest = (+state.data[0] == statesENUM.REQUEST_RATES);
                if (сanRequest) {
                    resolve();
                } else {
                    $translate("LIBRE_RURNotAllowed").then((msg) => reject(msg));
                }
            });
        });
    };

    function canCalc() {
        return new Promise((resolve, reject) => {
            Promise.all([
                getContractData("getState")
            ]).then((values) => {
                let 
                    state = values[0]; // Append user balance checking later

                let allowedState = (+state.data[0] == statesENUM.CALC_RATES);
                if (allowedState) {
                    resolve();
                } else {
                    $translate("LIBRE_CRNotAllowed").then((msg) => {
                        reject(msg);
                    });
                }
            });
        });
    }

    function getLatestBlockData() {
        return new Promise((resolve, reject) => {
            ajaxReq.getLatestBlockData((res) => {
                if (res.error) reject(res);
                if (IS_DEBUG) console.log(res);
                resolve(res);
            }) 
        })     
    }

    function toUnixtimeObject(obj) {
        try {
            var _time = toUnixtime(obj.data[0]);
            obj.data.push(_time);
            return obj;
        } catch(e) {
            return {error: true, message: e.message};
        }
    }

    function getGasPrice() {
        return globalFuncs.localStorage.getItem("gasPrice", null);
    }

    function getEthCall(options) {
        return new Promise((resolve,reject) => {
            ajaxReq.getEthCall({
                from: options.from,
                data: options.data,
                to: options.to
            }, (res) => {
                if(!res.error && res.data != '0x') {
                    resolve(res);
                } else {
                    reject(res);
                }
            });
        });
    }

    function getLatestBlockData() {
        return new Promise((resolve, reject) => {
            ajaxReq.getLatestBlockData((res) => {
                if (res.error) reject(res);
                if (IS_DEBUG) console.log(res);
                resolve(res);
            }) 
        })
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
        coeff: coeff,
        methods: {
            getDataAsync: getDataAsync,
            getDataString: getDataString,
            getBankDataProcess: getBankDataProcess,
            getCashDataProcess: getCashDataProcess,
            getLBRSDataProcess: getLBRSDataProcess,
            getContractData: getContractData,
            getTokenData: getTokenData,
            getContractScope: getContractScope,
            getTokenScope: getTokenScope,
            toUnixtime: toUnixtime,
            toUnixtimeObject: toUnixtimeObject,
            normalizeRate: normalizeRate,
            hexToString: hexToString,
            getStateName: getStateName,
            fillStateData: fillStateData,
            checkMetamaskError: checkMetamaskError,
            libreTransaction: libreTransaction,
            getLibreRawTx: getLibreRawTx,
            canRequest: canRequest,
            canCalc: canCalc,
            canOrder: canOrder,
            getGasPrice: getGasPrice,
            getLatestBlockData: getLatestBlockData,
            getEstimatedGas: getEstimatedGas,
            getNetwork: getNetwork,
            TXConstructor: TX,
            getTransactionReceipt: getTransactionReceipt,
            sendTx: sendTx
        },
        networks: networks,
        IS_DEBUG: IS_DEBUG,
        mainTimer: mainTimer,
        oracleABI: oracleABI
    };
};
module.exports = libreService;