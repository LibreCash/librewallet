'use strict';
var bankStatusCtrl = function($scope) {
    let libreData = nodes.nodeList.rin_ethscan.libre;
    let bankAbi = libreData.libreBank.abi,
        bankAddress = libreData.libreBank.address;

    $scope.address = bankAddress;
    
};
module.exports = bankStatusCtrl;