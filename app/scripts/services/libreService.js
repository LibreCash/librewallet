'use strict';
var libreService = function(walletService) {
    var libreBank = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreBank");
    var bankAddress = libreBank.address;
    var bankAbi = libreBank.abi;
    var bankAbiRefactor = {};    
    for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];

    var libreCash = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreCash");
    var cashAddress = libreCash.address;
    var cashAbi = libreCash.abi;
    var cashAbiRefactor = {};    
    for (var i = 0; i < cashAbi.length; i++) cashAbiRefactor[cashAbi[i].name] = cashAbi[i];

    const RATE_MULTIPLIER = 1000; // todo перенести
    const TOKEN_DECIMALS = 18;

    var getDataString = function(func, inputs) {
        var fullFuncName = ethUtil.solidityUtils.transformToFullName(func);
        var funcSig = ethFuncs.getFunctionSignature(fullFuncName);
        var typeName = ethUtil.solidityUtils.extractTypeName(fullFuncName);
        var types = typeName.split(',');
        types = types[0] == "" ? [] : types;
        return '0x' + funcSig + ethUtil.solidityCoder.encodeParams(types, inputs);
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
                        data.message = "Possible error with network or the bank contract";
                    }
                } else {
                    var outTypes = abiRefactored[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                process(data, processParam);
            });
        })
    }

    function getDataProcess(address, abiRefactored, _var, process, params = []) {
        return getDataCommon(address, abiRefactored, _var, process, params, "");
    }

    function getBankDataProcess(_var, process, params = []) {
        return getDataProcess(bankAddress, bankAbiRefactor, _var, process, params);
    }

    function getCashDataProcess(_var, process, params = []) {
        return getDataProcess(cashAddress, cashAbiRefactor, _var, process, params);
    }

    async function getDataAsync(address, abiRefactored, _var, params = []) {
        return new Promise((resolve, reject) => { 
            ajaxReq.getEthCall({
                from: walletService.wallet == null ? null : walletService.wallet.getAddressString(),
                to: address,
                data: getDataString(abiRefactored[_var], params)
            }, function(data) {
                if (data.error || data.data == '0x') {
                    if (data.data == '0x') {
                        data.error = true;
                        data.message = "Possible error with network or the bank contract";
                    }
                } else {
                    var outTypes = abiRefactored[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                data.params = params;
                resolve(data);
            });
        })
    }

    async function getBankDataAsync(_var, params = []) {
        return getDataAsync(bankAddress, bankAbiRefactor, _var, params);
    }

    async function getCashDataAsync(_var, params = []) {
        return getDataAsync(cashAddress, cashAbiRefactor, _var, params);
    }

    function setScope(_scope, _value, _key) {
        _scope[_key] = _value.data[0];
    }

    function getDataScope(_scope, address, abiRefactored, _var, _key, params = []) {
        return getDataCommon(_scope, address, abiRefactored, _var, setScope, params, _key);
    }

    async function getBankDataScope(_scope, _var, _key, params = []) {
        return getDataScope(_scope, bankAddress, bankAbiRefactor, _var, _key, params);
    }

    async function getCashDataScope(_scope, _var, _key, params = []) {
        return getDataScope(_scope, cashAddress, cashAbiRefactor, _var, _key, params);
    }

    var normalizeUnixTime = function(data) {
        var date = new Date(data * 1000);
        return date.toLocaleString();
    }

    return {
        bank: {
            address: bankAddress,
            abi: bankAbiRefactor
        },
        token: {
            address: cashAddress,
            abi: cashAbiRefactor
        },
        coeff: {
            rateMultiplier: RATE_MULTIPLIER,
            tokenDecimals: TOKEN_DECIMALS
        },
        methods: {
            getDataString: getDataString,
            getBankDataProcess: getBankDataProcess,
            getCashDataProcess: getCashDataProcess,
            getBankDataAsync: getBankDataAsync,
            getCashDataAsync: getCashDataAsync,
            getBankDataScope: getBankDataScope,
            getCashDataScope: getCashDataScope,
            normalizeUnixTime: normalizeUnixTime
        },
        networkType: "rinkeby"

    }
};
module.exports = libreService;