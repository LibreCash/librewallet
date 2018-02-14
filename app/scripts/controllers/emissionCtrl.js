'use strict';
var emissionCtrl = function($scope, $sce, walletService, libreService, $rootScope, $translate) {
    var bankAddress = libreService.bank.address,
        cashAddress = libreService.token.address,
        bankAbiRefactor = libreService.bank.abi,
        cashAbiRefactor = libreService.token.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        getCashDataAsync = libreService.methods.getCashDataAsync,
        getBankDataProcess = libreService.methods.getBankDataProcess,
        getCashDataProcess = libreService.methods.getCashDataProcess,
        getDataString = libreService.methods.getDataString,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeUnixTimeObject = libreService.methods.normalizeUnixTimeObject,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        getStateName = libreService.methods.getStateName,
        rateMultiplier = libreService.coeff.rateMultiplier,
        gasEmission = libreService.coeff.gasEmission,
        gasRemission = libreService.coeff.gasRemission,
        gasApprove = libreService.coeff.gasApprove,
        fillStateData = libreService.methods.fillStateData,
        libreTransaction = libreService.methods.libreTransaction,
        canOrder = libreService.methods.canOrder,
        canRequest = libreService.methods.canRequest,
        canCalc = libreService.methods.canCalc;

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;

    $scope.cashAddress = cashAddress;
    $scope.bankAddress = bankAddress;
    $scope.RURCost = 'n/a';

    //$scope.allTokens = 'Loading';
    $scope.approvePending = false;
    $scope.sellPending = false;
    $scope.buyPending = false;
    $scope.orderAllowed = false;
    $scope.CRPending = false;
    $scope.RURPending = false;
    $scope.RURAllowed = false;
    $scope.CRAllowed = false;
    $scope.changedTokens = 0;
    $scope.changedEth = 0;

    //$scope.allTokens = 'Loading';
    $scope.Validator = Validator;
    $scope.gasLimitChanged = false;
    var currentTab = $scope.globalService.currentTab;
    var tabs = $scope.globalService.tabs;


    $scope.tx = {
        unit: "ether",
        sendMode: "ether",
        nonce: null,
        gasPrice: null,
        donate: false,
        tokensymbol: false
    }
    $scope.tx.readOnly = false;

    // remission
    function processSellRate(data) {
        $scope.sellRate = data.error ? data.message : normalizeRate(data.data[0]);
    }
    function processTokenCount(data) {
        $scope.tokenCount = data.error ? data.message : normalizeRate(data.data[0]);
    };

    function setAllTokens(data) {
        $scope.allTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    }

    function setAllowance(data) {
        $scope.allowedTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    }

    function updateBalanceAndAllowance() {
        getCashDataProcess("balanceOf", setAllTokens, [walletService.wallet.getAddressString()]);
        getCashDataProcess("allowance", setAllowance, [walletService.wallet.getAddressString(), bankAddress]);
    }

    // end remission

    $scope.pendingOrderAllowCheck = false;
    setInterval(() => {
        if ($scope.globalService.currentTab == $scope.globalService.tabs.emission.id) {
            if ($scope.pendingOrderAllowCheck) {
                return;
            }
            $scope.pendingOrderAllowCheck = true;

            ajaxReq.getLatestBlockData(function(blockData) {
                var lastBlockTime = parseInt(blockData.data.timestamp, 16);
                Promise.all([
                    getBankDataAsync("getState"),
                    getBankDataAsync("tokenBalance"),
                    getBankDataAsync("requestPrice")
                ]).then((values) => {
                    let 
                        state = values[0],
                        balance = values[1],
                        RURCost = values[2];

                    $scope.orderAllowed = (+state.data[0] == libreService.coeff.statesENUM.PROCESSING_ORDERS);
                    $scope.RURAllowed = (+state.data[0] == libreService.coeff.statesENUM.REQUEST_RATES);
                    $scope.CRAllowed = (+state.data[0] == libreService.coeff.statesENUM.CALC_RATES);
                    if ($scope.RURAllowed) {
                        $scope.RURCost = RURCost.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
                    }
                    $scope.pendingOrderAllowCheck = false;
                });
            });
    

        }
    }, 1000);

    function applyScope() {
        if (!$scope.$$phase) $scope.$apply();
    }

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return;
        $scope.wallet = walletService.wallet;
        updateContractData();
        updateBalanceAndAllowance();

        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    function isEnough(valA, valB) {
        return new BigNumber(valA).lte(new BigNumber(valB));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    function processBuyRate(data) {
        $scope.buyRate = data.error ? data.message : normalizeRate(data.data[0]);
    };

    function updateContractData() {
        getBankDataProcess("buyRate", processBuyRate);
        getBankDataProcess("sellRate", processSellRate);
        if (walletService.wallet != null) {
            updateBalanceAndAllowance();
        }
    }
    updateContractData();

    $scope.generateBuyLibreTx = function() {
        canOrder($scope, buyLibreTx, [$scope.buyRate, 0]);
    };

    function buyLibreTx() {
        let txData = getDataString(bankAbiRefactor["buyTokens"], [$scope.wallet.getAddressString()]);

        $scope.tx.data = txData;
        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasEmission;
        $scope.tx.value = $scope.buyTXValue;

        libreTransaction($scope, "buyPending", "BUY", $translate, updateBalanceAndAllowance);
    }


    $scope.generateApproveTx = function() {
        approveTx();
    }

    var approveTx = function() {
        getCashDataAsync("allowance", [walletService.wallet.getAddressString(), bankAddress]).then((allowanceData) => {
            if (allowanceData.error) {
                $scope.notifier.danger(allowanceData.msg);
                return;
            }
            var allowance = +allowanceData.data[0];

            var tokensToAllowCount = $scope.tokensToAllow * Math.pow(10, libreService.coeff.tokenDecimals);
            if (allowance == tokensToAllowCount) {
                $translate("LIBREALLOWANCE_equal").then((msg) => {
                    $scope.notifier.danger(msg);
                })
                return;
            } else if (tokensToAllowCount < allowance) {
                $scope.tx.data = getDataString(
                    cashAbiRefactor["decreaseApproval"], [bankAddress, allowance - tokensToAllowCount]
                );
            } else {
                // tokensToAllowCount > allowance
                $scope.tx.data = getDataString(
                    cashAbiRefactor["increaseApproval"], [bankAddress, tokensToAllowCount - allowance]
                );
            }
            $scope.tx.to = cashAddress;
            $scope.tx.gasLimit = gasApprove;
            $scope.tx.value = 0;

            libreTransaction($scope, "approvePending", "ALLOWANCE", $translate, updateBalanceAndAllowance);
        });
    }

    $scope.generateSellLibreTx = function() {
        canOrder($scope, sellLibreTx, [0, $scope.sellRate]);
    }

    var sellLibreTx = function() {
        var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals)
        $scope.tx.data = getDataString(bankAbiRefactor["sellTokens"], 
            [$scope.wallet.getAddressString(), tokenCount]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasRemission;
        $scope.tx.value = 0;

        libreTransaction($scope, "sellPending", "SELL", $translate, updateBalanceAndAllowance);
    }

    $scope.generateRURTx = function() {
        canRequest($scope, RURTx);
    }

    var RURTx = function() {
        getBankDataAsync("requestPrice", []).then((oracleDeficit) => {
            $scope.tx.data = getDataString(bankAbiRefactor["requestRates"], []);

            $scope.tx.to = bankAddress;
            $scope.tx.gasLimit = libreService.coeff.gasRUR;
            $scope.tx.value = etherUnits.toEther(+oracleDeficit.data[0], 'wei');
            $scope.tx.unit = 'ether';
    
            libreTransaction($scope, "RURPending", "RUR", $translate, updateContractData);
        });
    }

    $scope.generateCRTx = function() {
        canCalc($scope, CRTx);
    }

    var CRTx = function () {
        $scope.tx.data = getDataString(bankAbiRefactor["calcRates"], []);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = libreService.coeff.gasCR;
        $scope.tx.value = 0;
        $scope.tx.unit = 'ether';

        libreTransaction($scope, "CRPending", "CR", $translate, updateContractData);
    }

    $scope.transferAllBalance = function() {
        uiFuncs.transferAllBalance($scope.wallet.getAddressString(), libreService.coeff.gasEmission, function(resp) {
            if (!resp.isError) {
                $scope.tx.unit = resp.unit;
                $scope.tx.value = resp.value;
                $scope.buyTXValue = resp.value;
                $scope.changedTokens = resp.value * $scope.buyRate;
            } else {
                $scope.notifier.danger(resp.error);
            }
        });
    }
};
module.exports = emissionCtrl;
