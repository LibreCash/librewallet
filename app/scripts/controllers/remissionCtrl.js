'use strict';
var remissionCtrl = function($scope, $sce, walletService, libreService, $rootScope, $translate) {
    var bankAddress = libreService.bank.address,
        cashAddress = libreService.token.address,
        bankAbiRefactor = libreService.bank.abi,
        cashAbiRefactor = libreService.token.abi,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        getCashDataAsync = libreService.methods.getCashDataAsync,
        getBankDataProcess = libreService.methods.getBankDataProcess,
        getCashDataProcess = libreService.methods.getCashDataProcess,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeUnixTimeObject = libreService.methods.normalizeUnixTimeObject,
        getDataString = libreService.methods.getDataString,
        fillStateData = libreService.methods.fillStateData,
        normalizeRate = libreService.methods.normalizeRate,
        rateMultiplier = libreService.coeff.rateMultiplier,
        gasRemission = libreService.coeff.gasRemission,
        gasApprove = libreService.coeff.gasApprove,
        gasWithdraw = libreService.coeff.gasWithdraw,
        libreTransaction = libreService.methods.libreTransaction,
        canOrder = libreService.methods.canOrder,
        canRequest = libreService.methods.canRequest;

    console.log("Hello remissionCtrl");
    //$scope.state = 

    canRequest((data) => {
        console.log("canRequest call function text!!!", data);
    });
    
    //$scope.canRequest = 0;
    //$scope.canCalc

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    function processSellRate(data) {
        $scope.sellRate = data.error ? data.message : normalizeRate(data.data[0]);
    }
    function processTokenCount(data) {
        $scope.tokenCount = data.error ? data.message : normalizeRate(data.data[0]);
    };

    $scope.allTokens = 'Loading';

    $scope.cashAddress = cashAddress;

    $scope.approvePending = false;
    $scope.sellPending = false;
    $scope.tx = {};
    $scope.tx.value = 0;
    $scope.signedTx;
    $scope.ajaxReq = ajaxReq;
    $scope.unitReadable = ajaxReq.type;
    $scope.remissionModal = new Modal(document.getElementById('remission'));
    //walletService.wallet = null;
    //walletService.password = '';
    $scope.showAdvance = $rootScope.rootScopeShowRawTx = false;
    $scope.Validator = Validator;
    $scope.gasLimitChanged = false;
    $scope.tx.readOnly = globalFuncs.urlGet('readOnly') == null ? false : true;
    var currentTab = $scope.globalService.currentTab;
    var tabs = $scope.globalService.tabs;
    $scope.tokenTx = {
        to: '',
        value: 0,
        id: -1
    };
    $scope.customGasMsg = '';
          
    $scope.customGas = CustomGasMessages;

    $scope.tx = {
        gasLimit: gasRemission,
        data: "",
        to: bankAddress,
        unit: "ether",
        value: 0,
        nonce: null,
        gasPrice: null,
        donate: false,
        tokensymbol: false,
        sendMode: "ether"
    }

    $scope.unitReadable = ajaxReq.type;

    function applyScope() {
        if (!$scope.$$phase) $scope.$apply();
    }

    function defaultInit() {
        $scope.gasLimitChanged = false;
        $scope.showAdvance = false;
    }

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

    $scope.$watch(function() {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function() {
        if (walletService.wallet == null) return; 
        updateContractData();
        updateBalanceAndAllowance();
        $scope.wallet = walletService.wallet;
        $scope.wd = true;
        $scope.wallet.setBalance(applyScope);
        if ($scope.parentTxConfig) {
            var setTxObj = function() {
                $scope.addressDrtv.ensAddressField = $scope.parentTxConfig.to;
                $scope.tx.value = 0;
                $scope.tx.sendMode = 'ether';
                $scope.tx.gasPrice = $scope.parentTxConfig.gasPrice ? $scope.parentTxConfig.gasPrice : null;
                $scope.tx.nonce = $scope.parentTxConfig.nonce ? $scope.parentTxConfig.nonce : null;
                $scope.tx.data = $scope.parentTxConfig.data ? $scope.parentTxConfig.data : $scope.tx.data;
                $scope.tx.readOnly = $scope.addressDrtv.readOnly = $scope.parentTxConfig.readOnly ? $scope.parentTxConfig.readOnly : false;
                if ($scope.parentTxConfig.gasLimit) {
                    $scope.tx.gasLimit = $scope.parentTxConfig.gasLimit;
                    $scope.gasLimitChanged = true;
                }
            }
            $scope.$watch('parentTxConfig', function() {
                setTxObj();
            }, true);
        }
        defaultInit();
    });

    $scope.$watch('ajaxReq.key', function() {
        if ($scope.wallet) {
            $scope.wallet.setBalance(applyScope);
            $scope.wallet.setTokens();
        }
    });

    $scope.$watch('tx', function(newValue, oldValue) {
        $rootScope.rootScopeShowRawTx = false;
    }, true);

    var isEnough = function(valA, valB) {
        //return new BigNumber(valA).lte(new BigNumber(vatransformToFullName transformToFullName lB));
        return true;
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    function updateContractData() {
        if (walletService.wallet != null) {
            updateBalanceAndAllowance();
        }
        getBankDataProcess("getState", function(data) {
            $scope.bankState = fillStateData(data);
        });

        getBankDataProcess("sellRate", processSellRate);
    }
    updateContractData();


    
    $scope.generateApproveTx = function() {
        //ifNotPaused($scope, approveTx);
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

            libreTransaction($scope, "approvePending", "ALLOWANCE", $translate, updateContractData);
        });
    }

    $scope.generateSellLibreTx = function() {
        canOrder($scope, sellLibreTx);
    }

    var sellLibreTx = function() {
        var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals)
        $scope.tx.data = getDataString(bankAbiRefactor["sellTokens"], 
            [$scope.wallet.getAddressString(), tokenCount]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasRemission;

        libreTransaction($scope, "sellPending", "SELL", $translate, updateContractData);
    }

};
module.exports = remissionCtrl;
