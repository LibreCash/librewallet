'use strict';
var bankStatusCtrl = function($scope) {
    let libreData = nodes.nodeList.rin_ethscan.libre;
    let bankAbi = libreData.libreBank.abi,
        bankAddress = libreData.libreBank.address;


// нужно рефакторнуть аби, чтобы оборащаться к нему, как сделано в ens
    var bankAbiRefactor = {};
    for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];
// далее три функции из ens
    var normalise = function(name) {
        try {
            return uts46.toUnicode(name, { useStd3ASCII: true, transitional: false });
        } catch (e) {
            throw e;
        }
    };
    function namehash(name) {
        name = ens.normalise(name);
        var node = Buffer.alloc(32);
        if (name && name != '') {
            var labels = name.split(".");
            for (var i = labels.length - 1; i >= 0; i--) {
                node = ethUtil.sha3(Buffer.concat([node, ethUtil.sha3(labels[i])]));
            }
        }
        return '0x' + node.toString('hex');
    }
    var getDataString = function(func, inputs) {
        var fullFuncName = ethUtil.solidityUtils.transformToFullName(func);
        var funcSig = ethFuncs.getFunctionSignature(fullFuncName);
        var typeName = ethUtil.solidityUtils.extractTypeName(fullFuncName);
        var types = typeName.split(',');
        types = types[0] == "" ? [] : types;
        return '0x' + funcSig + ethUtil.solidityCoder.encodeParams(types, inputs);
    };

    // ну и получаем инфу
    var whatToGet = "relevancePeriod";
    ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[whatToGet], [namehash(whatToGet)]) }, function(data) {
        if (data.error || data.data == '0x') $scope.data0 = data;
        else {
            var outTypes = bankAbiRefactor[whatToGet].outputs.map(function(i) {
                return i.type;
            });
            data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''))[0];
            $scope.data0 = data;
        }
    });



    $scope.address = bankAddress;
    
};
module.exports = bankStatusCtrl;