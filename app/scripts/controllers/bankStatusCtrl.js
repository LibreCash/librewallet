'use strict';
var bankStatusCtrl = function($scope) {
    var NAME_BANK = "Librebank";
    var bankAbi = "",
        bankAddress;
    for (var i in nodes.nodeList.rin_ethscan.abiList) {
        let _contract = nodes.nodeList.rin_ethscan.abiList[i];
        if (_contract.name === NAME_BANK) {
            bankAddress = _contract.address;
            bankAbi = _contract.abi;
        }
    }
    if (bankAbi === "") {
        // todo: throw error
    }
    
};
module.exports = bankStatusCtrl;