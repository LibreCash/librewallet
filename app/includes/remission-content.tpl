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

    <section class="row form-group">
    <!-- To Address -->

      <div class="col-sm-11">
          <strong translate="LIBRE_contracts">
              Contracts
          </strong>
      </div>
      <div class="col-sm-11">
        <span>LibreBank</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', tx.to) }}" target="_blank" rel="noopener noreferrer">{{ tx.to }}</a>
        <br/>
        <span>LibreCash</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', cashAddress) }}" target="_blank" rel="noopener noreferrer">{{ cashAddress }}</a>
        <br/>
        <span translate="LIBRE_checkLegit">Please, check its legitimity.</span>
      </div>
  
      <div class="col-sm-11">
        <label translate="LIBRE_balance">
            Balance
        </label>
      </div>
      <p class="col-xs-12">
        <span translate="LIBRE_allowed">Allowed: </span><span>{{ allowedTokens | number: 3 }}</span>
        <br/>
        <span>All tokens: </span><span>{{ allTokens | number: 3 }}</span>
      </p>
      <div ng-show="allTokens == 0" class="col-sm-11">
          <strong translate="LIBRE_noTokens">
              No tokens on balance
          </strong>
      </div>
      <div ng-hide="allTokens == 0">
        <div class="col-sm-11" ng-hide="tx.readOnly">
          <label translate="LIBRE_allowance">
              Allowance
          </label>
        </div>
        <div class="col-sm-11">
          <div class="input-group">
            <input type="text"
                    class="form-control"
                    placeholder="{{ allTokens | number: 3 }}"
                    ng-model="tokensToAllow"
                    ng-disabled="tx.readOnly || checkTxReadOnly"
                    ng-class="Validator.isPositiveNumber(tokensToAllow) ? 'is-valid' : 'is-invalid'"/>
            <div class="input-group-btn">
              <a style="min-width: 170px"
                class="btn btn-default"
                ng-hide="approvePending"
                ng-click="generateApproveTx()">
                <strong translate="LIBRE_approve">
                  Approve
                </strong>
              </a>
              <a style="min-width: 170px"
                class="btn btn-default"
                ng-show="approvePending"
                disabled
                translate="LIBRE_txPending">
                    pending...
              </a>
            </div>
          
          </div>
        </div>
        <p class="col-xs-12" ng-hide="tx.readOnly">
          <a ng-click="tokensToAllow = allTokens">
            <span class="strong" translate="LIBRE_approveAll">
              Approve whole balance
            </span>
          </a>
        </p>
      
          <!-- Amount to Send -->
        <div class="col-sm-11">
          <label translate="LIBRE_sellTokens">
            Tokens to Sell:
          </label>
        </div>
      
        <div class="col-sm-11">
            <input type="text"
                    class="form-control"
                    placeholder="{{ 'SEND_amount_short' | translate }}"
                    ng-model="tokenValue"
                    ng-disabled="tx.readOnly || checkTxReadOnly"
                    ng-class="Validator.isPositiveNumber(tokenValue) ? 'is-valid' : 'is-invalid'"/>
        </div>
      
            <!-- Amount to Send - Transfer Entire Balance -->
        <p class="col-xs-12" ng-hide="tx.readOnly">
          
          <a ng-click="tokenValue = allowedTokens">
            <span class="strong" translate="LIBRE_sellAllApproved">
              Sell All Approved
            </span>
          </a>
        </p>
      
      
      
            <!-- rateLimit -->
        <div class="col-sm-11">
          <label translate="LIBRE_minPriceSell">
            Minimum Sell Price
          </label>
        </div>

        <div class="col-sm-11">
          <input type="text"
                  class="form-control"
                  placeholder="0"
                  ng-model="tx.rateLimit"
                  ng-class="Validator.isPositiveNumber(tx.rateLimit) ? 'is-valid' : 'is-invalid'"/>
        </div>
        <div class="col-sm-8 offset-col-sm-2">
            <a style="min-width: 170px"
              class="btn btn-default"
              ng-hide="sellPending"
              ng-click="generateSellLibreTx()">
              <strong translate="LIBRE_sell">
                Sell
              </strong>
            </a>
            <a style="min-width: 170px"
              class="btn btn-default"
              ng-show="sellPending"
              disabled
              translate="LIBRE_txPending">
                  pending...
            </a>
        </div>
      </div>

      <div class="col-sm-11">
        <span translate="LIBRE_sellRate">Last sell price</span>: {{ sellRate }} <span>LIBRE/ETH</span>
      </div>
      <div>
        <div class="col-sm-11">
          <span translate="LIBRE_withdrawInfo">You can withdraw your ETH after the remission round</span>
        </div>
        <div class="col-sm-11" ng-rrrshow="getBalance > 0">
          <span translate="LIBRE_getEther">ETH to withdraw</span>
          <div class="col-sm-11">
            <div class="input-group">
              <input type="text"
                      class="form-control"
                      placeholder="{{ getBalance }}"
                      ng-model="getBalance"
                      disabled
                      ng-class="Validator.isPositiveNumber(tokenValue) ? 'is-valid' : 'is-invalid'"/>
              <div class="input-group-btn">
                <a style="min-width: 170px"
                    class="btn btn-default"
                    ng-hide="withdrawPending"
                    ng-click="generateWithdrawLibreTx()">
                    <strong translate="LIBRE_withdraw">
                      Withdraw
                    </strong>
                </a>
                <a style="min-width: 170px"
                  class="btn btn-default"
                  ng-show="withdrawPending"
                  disabled
                  translate="LIBRE_txPending">
                      pending...
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

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
