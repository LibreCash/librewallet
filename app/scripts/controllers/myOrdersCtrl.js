'use strict';
var myOrdersCtrl = async function($scope, $sce, walletService, libreService, globalService, $rootScope, $translate) {
    var bankAddress = libreService.bank.address,
        cashAddress = libreService.token.address,
        bankAbiRefactor = libreService.bank.abi,
        cashAbiRefactor = libreService.token.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeUnixTimeObject = libreService.methods.normalizeUnixTimeObject,
        universalLibreTransaction = libreService.methods.universalLibreTransaction,
        fillStateData = libreService.methods.fillStateData,
        gasRUR = libreService.coeff.gasRUR,
        gasCR = libreService.coeff.gasCR,
        gasQueue = libreService.coeff.gasQueue,
        getDataString = libreService.methods.getDataString,
        ifAllowedRUR = libreService.methods.ifAllowedRUR,
        ifAllowedCR = libreService.methods.ifAllowedCR,
        ifAllowedQueue = libreService.methods.ifAllowedQueue;

    $scope.tx = {};
    $scope.viewForceEmission = false;
    $scope.RURPending = false;
    $scope.CRPending = false;
    $scope.PBuyPending = false;
    $scope.PSellPending = false;
    $scope.RURAllowed = false;
    $scope.CRAllowed = false;
    $scope.queuesAllowed = false;
    
    setInterval(() => {
        if (!$scope.viewForceEmission || globalService.currentTab!=globalService.tabs.myOrders.id) {
            return;
        }
        ajaxReq.getLatestBlockData(async function(blockData) {
            const MIN_READY_ORACLES = 2; // better to get from libreService
    
            var lastBlockTime = parseInt(blockData.data.timestamp, 16); 
            //$scope.lastBlock = normalizeUnixTimeObject(lastBlockTime);
            $scope.lastBlock = normalizeUnixTime(lastBlockTime);
            Promise.all([
                getBankDataAsync("timeUpdateRequest"),
                getBankDataAsync("queuePeriod"),
                getBankDataAsync("relevancePeriod"),
                getBankDataAsync("contractState"),
                getBankDataAsync("paused"),
                getBankDataAsync("getOracleDeficit"),
                getBankDataAsync("numReadyOracles"),
                getBankDataAsync("numEnabledOracles")
            ]).then((values) => {
                let _timeUpdateRequest = values[0],
                    _queuePeriod = values[1],
                    _relevancePeriod = values[2],
                    _contractState = values[3],
                    _paused = values[4],
                    _oracleDeficit = values[5],
                    _readyOracles = values[6],
                    _enabledOracles = values[7];

                    let stateData = fillStateData(_contractState);
                    $scope.bankState = stateData;
                    $scope.timeUpdateRequest = normalizeUnixTimeObject(_timeUpdateRequest);
                    $scope.relevancePeriod = _relevancePeriod;
                    $scope.queuePeriod = _queuePeriod;
                    $scope.contractPaused = _paused.data[0];
                    $scope.readyOracles = _readyOracles.error ? "-" : _readyOracles.data[0];
                    $scope.enabledOracles = _enabledOracles.error ? "-" : _enabledOracles.data[0];
                    $scope.rurCost = etherUnits.toEther(_oracleDeficit.data[0], 'wei');

                    var lastedTime = +lastBlockTime - +_timeUpdateRequest.data[0];
                    $scope.RURAllowed = (!_paused.data[0]) && ((_contractState.data[0] == 0) || (lastedTime >= _relevancePeriod.data[0]));
                    $scope.CRAllowed = (!_paused.data[0]) && (_contractState.data[0] == 1) && (
                        (+_readyOracles.data[0] == +_enabledOracles.data[0]) ||
                        (+_readyOracles.data[0] >= MIN_READY_ORACLES && lastedTime >= 10 * 60) // 10 minutes to wait for oracles
                    );
                    $scope.queuesAllowed = (!_paused.data[0]) && ((_contractState.data[0] == 2) && (lastedTime < _queuePeriod.data[0]));
                    
            });
        });
    }, 10000);

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType)
        $scope.notifier.danger(await $translate("LIBREBUY_networkFail"));

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

    var updateStatus = function() {
        fillOrders();
    }

    var RURTx = async function(oracleDeficit) {
        $scope.tx.data = getDataString(bankAbiRefactor["requestUpdateRates"], []);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasRUR;
        $scope.tx.value = etherUnits.toEther(oracleDeficit, 'wei');
        $scope.tx.unit = 'ether';

        universalLibreTransaction($scope, "RURPending", "RUR", $translate, updateStatus);
    }

    $scope.generateRURTx = function() {
        ifAllowedRUR($scope, RURTx);
    }

    $scope.generateCRTx = function() {
        ifAllowedCR($scope, CRTx);
    }

    var CRTx = async function () {
        $scope.tx.data = getDataString(bankAbiRefactor["calcRates"], []);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasCR;
        $scope.tx.value = 0;
        $scope.tx.unit = 'ether';

        universalLibreTransaction($scope, "CRPending", "CR", $translate, updateStatus);
    }

    $scope.generatePBUYTx = function() {
        ifAllowedQueue($scope, PBUYTx, 5);
    }

    $scope.generatePSELLTx = function() {
        ifAllowedQueue($scope, PSELLTx, 5);
    }

    var PBUYTx = async function (numOrders) {
        $scope.tx.data = getDataString(bankAbiRefactor["processBuyQueue"], [numOrders]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasQueue;
        $scope.tx.value = 0;
        $scope.tx.unit = 'ether';

        universalLibreTransaction($scope, "PBuyPending", "PBUY", $translate, updateStatus);
    }

    var PSELLTx = async function (numOrders) {
        $scope.tx.data = getDataString(bankAbiRefactor["processSellQueue"], [numOrders]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasQueue;
        $scope.tx.value = 0;
        $scope.tx.unit = 'ether';

        universalLibreTransaction($scope, "PSellPending", "PSELL", $translate, updateStatus);
    }

};
module.exports = myOrdersCtrl;