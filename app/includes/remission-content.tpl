<!-- Content -->
<div class="col-sm-8">

  <!-- If unlocked with address only -->
  <article class="block" ng-show="wallet.type=='addressOnly'">
    <div class="row form-group">
      <h4 translate="SEND_ViewOnly">
        You cannot send with only your address. You must use one of the other options to unlock your wallet in order to send.
      </h4>
      <h5 translate="X_HelpfulLinks">
        Helpful Links &amp; FAQs
      </h5>
      <ul>
        <li class="u__protip">
          <a href="https://myetherwallet.github.io/knowledge-base/getting-started/accessing-your-new-eth-wallet.html"
             target="_blank"
             rel="noopener noreferrer"
             translate="X_HelpfulLinks_1">
                How to Access your Wallet
          </a>
        </li>
        <li class="u__protip">
          <a href="https://myetherwallet.github.io/knowledge-base/private-keys-passwords/lost-eth-private-key.html"
             target="_blank"
             rel="noopener noreferrer"
             translate="X_HelpfulLinks_2">
                I lost my private key
          </a>
        </li>
        <li class="u__protip">
          <a href="https://myetherwallet.github.io/knowledge-base/private-keys-passwords/accessing-different-address-same-private-key-ether.html"
             target="_blank"
             rel="noopener noreferrer"
             translate="X_HelpfulLinks_3">
                My private key opens a different address
          </a>
        </li>
        <li class="u__protip">
          <a href="https://myetherwallet.github.io/knowledge-base/migration/"
             target="_blank"
             rel="noopener noreferrer"
             translate="X_HelpfulLinks_4">
                Migrating to/from MyEtherWallet
          </a>
        </li>
      </ul>
    </div>
  </article>

  <!--nav class="container nav-container">
    <div class="nav-scroll">
    <ul class="nav-inner">
        <li class="nav-item {{ buy ? 'active' : '' }}" ng-click="buy=true; tx = tx"><a translate="BUYSELL_buyLibre">Buy Librecash</a></li>
        <li class="nav-item {{ buy ? '' : 'active' }}" ng-click="buy=false; tx = txSell"><a translate="BUYSELL_sellLibre">Sell Librecash</a></li>
    </ul>
    </div>
  </nav-->

  <!-- If unlocked with PK -->
  <article class="block" ng-hide="wallet.type=='addressOnly'" ng-show="buy">
    <!-- To Address -->
    <div class="row">
      <span translate="LIBRE_addressText">LibreBank address</span>: {{ tx.to }}. <span translate="LIBRE_checkLegit">Please, check its legitimity.</span>
    </div>

    <section class="row form-group">

    <!-- Amount to Send -->
      <div class="col-sm-11">
        <label translate="LIBRE_sellTokens">
          Tokens to Sell:
        </label>
      </div>

      <div class="col-sm-11">
        <div class="input-group">
          <input type="text"
                 class="form-control"
                 placeholder="{{ 'SEND_amount_short' | translate }}"
                 ng-model="tokenValue"
                 ng-disabled="tx.readOnly || checkTxReadOnly"
                 ng-class="Validator.isPositiveNumber(tokenValue) ? 'is-valid' : 'is-invalid'"/>

        </div>
      </div>

      <!-- Amount to Send - Transfer Entire Balance -->
      <p class="col-xs-12" ng-hide="tx.readOnly">
        <a ng-click="transferAllBalance()">
          <span class="strong" translate="LIBRE_sendAllTokens">
            Send All Tokens
          </span>
        </a>
      </p>

      <!-- rateLimit -->
        <div class="col-sm-11">
          <label translate="LIBRE_minPriceSell">
            Minimum Price to Sell:
          </label>
        </div>

        <div class="col-sm-11">
          <input type="text"
                 class="form-control"
                 placeholder="0"
                 ng-model="tx.rateLimit"
                 ng-class="Validator.isPositiveNumber(tx.rateLimit) ? 'is-valid' : 'is-invalid'"/>
        </div>

        <div class="col-sm-11">
          <span translate="LIBRE_sellRate">Current sell price</span>: {{ sellRate }} <span>LIBRE/ETH</span>
        </div>
    </section>

    <!-- Gas Limit -->
    <section class="row form-group">
      <div class="col-sm-11 clearfix">
        <a class="account-help-icon"
           href="https://myetherwallet.github.io/knowledge-base/gas/what-is-gas-ethereum.html"
           target="_blank"
           rel="noopener noreferrer">
          <img src="images/icon-help.svg" class="help-icon" />
          <p class="account-help-text" translate="GAS_LIMIT_Desc"></p>
        </a>
        <label translate="TRANS_gas">
          Gas Limit:
        </label>
        <input type="text"
               class="form-control"
               placeholder="200000"
               ng-model="tx.gasLimit"
               ng-change="gasLimitChanged=true"
               ng-disabled="tx.readOnly || checkTxReadOnly"
               ng-class="Validator.isPositiveNumber(tx.gasLimit) ? 'is-valid' : 'is-invalid'" />
      </div>
    </section>


    <div class="clearfix form-group">
      <div class="well" ng-show="wallet!=null && customGasMsg!=''">
        <p>
          <span translate="SEND_CustomAddrMsg">
            A message regarding
          </span>
          {{tx.to}}
          <br />
          <strong>
            {{customGasMsg}}
          </strong>
        </p>
      </div>
    </div>



    <div class="row form-group">
      <div class="col-xs-12 clearfix">
        <a class="btn btn-info btn-block"
           ng-click="generateSellLibreTx()"
           translate="SEND_generate">
              Generate Transaction
        </a>
      </div>
    </div>

    <div class="row form-group" ng-show="showRaw">

      <div class="col-sm-6">
        <label translate="SEND_raw">
          Raw Transaction
        </label>
        <textarea class="form-control" rows="4" readonly>{{rawTx}}</textarea>
      </div>

      <div class="col-sm-6">
        <label translate="SEND_signed">
          Signed Transaction
        </label>
        <textarea class="form-control" rows="4" readonly>{{signedTx}}</textarea>
      </div>

    </div>

    <div class="clearfix form-group" ng-show="showRaw">
      <a class="btn btn-primary btn-block col-sm-11"
         data-toggle="modal"
         data-target="#remission"
         translate="SEND_trans"
         ng-click="parseSignedTx( signedTx )">
             Send Transaction
      </a>
    </div>


  </article>

</div>
<!-- / Content -->





<!-- Sidebar -->
<section class="col-sm-4">

  <div class="block block--danger"
       ng-show="wallet!=null && globalService.currentTab==globalService.tabs.swap.id && !hasEnoughBalance()">

    <h5 translate="SWAP_Warning_1">
      Warning! You do not have enough funds to complete this swap.
    </h5>

    <p translate="SWAP_Warning_2">
      Please add more funds to your wallet or access a different wallet.
    </p>

  </div>

  <wallet-balance-drtv></wallet-balance-drtv>

  <div ng-show="checkTxPage"
       ng-click="checkTxReadOnly=!checkTxReadOnly"
       class="small text-right text-gray-lighter">
        <small translate="X_Advanced">
          Advanced Users Only.
        </small>
  </div>

</section>
<!-- / Sidebar -->
