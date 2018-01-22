'use strict';
const TOKEN_DECIMALS = 18;

var walletService,
    allTokens = 0;
var libreBank = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreBank");
var bankAddress = libreBank.address;
var bankAbi = libreBank.abi;
var bankAbiRefactor = {};
for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];

var libreCash = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreCash");
var cashAddress = libreCash.address;
    //$scope.cashAddress = cashAddress;
var cashAbi = libreCash.abi;
var cashAbiRefactor = {};
for (var i = 0; i < cashAbi.length; i++) cashAbiRefactor[cashAbi[i].name] = cashAbi[i];

var getDataString = function(func, inputs) {
    var fullFuncName = ethUtil.solidityUtils.transformToFullName(func);
    var funcSig = ethFuncs.getFunctionSignature(fullFuncName);
    var typeName = ethUtil.solidityUtils.extractTypeName(fullFuncName);
    var types = typeName.split(',');
    types = types[0] == "" ? [] : types;
    return '0x' + funcSig + ethUtil.solidityCoder.encodeParams(types, inputs);
};

var setAllTokens = function(data) {
    console.log(data);
    allTokens = data.data[0] / Math.pow(10, TOKEN_DECIMALS);
}

//exports.getDataCommon = 
function getDataCommon(address, abiRefactored, _var, process, transactionParams, processParam) {
    return new Promise((resolve, reject) => {
        ajaxReq.getEthCall({ to: address, data: getDataString(abiRefactored[_var], transactionParams) }, function(data) {
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

//exports.getDataProcess = 
function getDataProcess(address, abiRefactored, _var, process, params = []) {
    return getDataCommon(address, abiRefactored, _var, process, params, "");
}

//exports.getHello = 
function hello() {
    console.log("Hello");
}

//exports.getBankDataProcess = 
function getBankDataProcess(_var, process, params = []) {
    return getDataProcess(bankAddress, bankAbiRefactor, _var, process, params);
}

//exports.getCashDataProcess = 
function getCashDataProcess(_var, process, params = []) {
    return getDataProcess(cashAddress, cashAbiRefactor, _var, process, params);
}

exports.balance = function(_walletService) {
    walletService = _walletService;
    if (walletService.wallet != null) {
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
    }
    return allTokens;
}