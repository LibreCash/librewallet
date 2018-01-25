'use strict';
var myOrdersCtrl = async function($scope, $sce, walletService, libreService, $rootScope) {
    var bankAddress = libreService.bank.address,
        cashAddress = libreService.token.address,
        bankAbiRefactor = libreService.bank.abi,
        cashAbiRefactor = libreService.token.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        normalizeUnixTime = libreService.methods.normalizeUnixTime;

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType)
        $scope.notifier.danger("Contract work only in rinkeby network!!");

    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;

    var applyScope = function() {
        if (!$scope.$$phase) $scope.$apply();
    }

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, async function() {
        if (walletService.wallet == null) return;
        fillOrders();
        $scope.wallet = walletService.wallet;
        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.orders = [];
    // to be run from wallet watcher when wallet!=null
    async function fillOrders() {
        var orderIDs = await getBankDataAsync("getMyOrders");
        if (!orderIDs.error) {
            $scope.orders = [];
            var promises = [];
            let buyOrdersData = orderIDs.data[0],
                sellOrdersData = orderIDs.data[1];
            if (buyOrdersData.length == 0 && sellOrdersData.length == 0) {
                $scope.anyOrders = false;
                return;
            } else
                $scope.anyOrders = true;
            buyOrdersData.forEach(
                orderID => {
                    let orderData = {id: orderID, type: "Buy", currency: "ETH"};
                    let orderPromise = getBankDataAsync("getBuyOrder", [orderID]);
                    promises.push(orderPromise);
                    $scope.orders.push(orderData);
                }
            );
            sellOrdersData.forEach(
                orderID => {
                    let orderData = {id: orderID, type: "Sell", currency: "LCH"};
                    let orderPromise = getBankDataAsync("getSellOrder", [orderID]);
                    promises.push(orderPromise);
                    $scope.orders.push(orderData);
                }
            );
            Promise.all(promises).then(ordersData => {
                ordersData.forEach(_order => {
                    let _id = _order.params[0],
                        curOrder = $scope.orders.find(order => order.id == _id);
                    // data[0] is sender, no need
                    curOrder.recipient = _order.data[1];
                    curOrder.amount = _order.data[2] / Math.pow(10, libreService.coeff.tokenDecimals);
                    curOrder.timestamp = normalizeUnixTime(_order.data[3]);
                    curOrder.rateLimit = _order.data[4] / libreService.coeff.rateMultiplier;
                    applyScope();
                });
            });
        } else {
            $scope.notifier.danger(orderIDs.msg, 0);
        }
    }
};
module.exports = myOrdersCtrl;
