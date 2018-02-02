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
        statusAllowsOrders = libreService.methods.statusAllowsOrders,
        ifNotPaused = libreService.methods.ifNotPaused;

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    var processSellRate = function(data) {
        $scope.sellRate = data.error ? data.message : normalizeRate(data.data[0]);
        $scope.tx.rateLimit = data.error ? 0 : normalizeRate(data.data[0] * 0.9); // +10%
    },
    processTokenCount = function(data) {
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
        rateLimit: 0,
        sendMode: "ether"
    }

    $scope.unitReadable = ajaxReq.type;

    var applyScope = function() {
        if (!$scope.$$phase) $scope.$apply();
    }

    var defaultInit = function() {
        $scope.gasLimitChanged = false;
        $scope.showAdvance = false;
    }

    var setAllTokens = function(data) {
        $scope.allTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    }, 
    setAllowance = function(data) {
        $scope.allowedTokens = data.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
    };

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
        return new BigNumber(valA).lte(new BigNumber(valB));
    }

    $scope.hasEnoughBalance = function() {
        if ($scope.wallet.balance == 'loading') return false;
        return isEnough($scope.tx.value, $scope.wallet.balance);
    }

    function updateContractData() {
        if (walletService.wallet != null) {
            updateBalanceAndAllowance();
            getBankDataProcess("getBalanceEther", function(_balance) {
                $scope.getBalance = _balance.data[0] / Math.pow(10, libreService.coeff.tokenDecimals);
            });
        }
        getBankDataProcess("contractState", function(data) {
            $scope.bankState = fillStateData(data);
        });

        getBankDataProcess("cryptoFiatRateSell", processSellRate);
    }
    updateContractData();


    
    $scope.generateApproveTx = function() {
        ifNotPaused($scope, approveTx);
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
        statusAllowsOrders($scope, sellLibreTx);
    }

    var sellLibreTx = function() {
        var tokenCount = $scope.tokenValue * Math.pow(10, libreService.coeff.tokenDecimals);
        var rateLimit = Math.round($scope.tx.rateLimit * rateMultiplier);
        $scope.tx.data = getDataString(bankAbiRefactor["createSellOrder"], 
            [$scope.wallet.getAddressString(), tokenCount, rateLimit]);

        $scope.tx.to = bankAddress;
        $scope.tx.gasLimit = gasRemission;

        libreTransaction($scope, "sellPending", "SELL", $translate, updateContractData);
    }

    $scope.generateWithdrawEthTx = function() {
        ifNotPaused($scope, withdrawEthTx);
    }

    var withdrawEthTx = function() {
        $scope.tx.to = bankAddress;
        $scope.tx.data = getDataString(bankAbiRefactor["getEther"], []);
        $scope.tx.gasLimit = gasWithdraw;

        libreTransaction($scope, "withdrawPending", "WITHDRAW", $translate, updateContractData);
    }

};
module.exports = remissionCtrl;
