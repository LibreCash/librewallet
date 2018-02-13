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

  <!-- If unlocked with PK -->
  <article class="block" ng-hide="wallet.type=='addressOnly'" ng-show="buy">

    <section class="row form-group">
      <div class="col-sm-11">
          <strong translate="LIBRE_contracts">
              Contracts
          </strong>
      </div>
      <div class="col-sm-11">
        <span>LibreBank</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', bankAddress) }}" target="_blank" rel="noopener noreferrer">{{ tx.to }}</a>
        <br/>
        <span>LibreCash</span>: <a href="{{ ajaxReq.blockExplorerAddr.replace('[[address]]', cashAddress) }}" target="_blank" rel="noopener noreferrer">{{ cashAddress }}</a>
        <br/>
        <span translate="LIBRE_checkLegit">Please, check its legitimity.</span>
      </div>
    <!-- Amount to Send -->
      <div class="col-sm-11">
        <label translate="LIBRE_sendAmount">
          ETH -> Libre
        </label>
      </div>

      <div class="col-sm-11">
        <div class="input-group">
          <input type="text"
                  class="form-control"
                  placeholder="{{ 'SEND_amount_short' | translate }}"
                  ng-model="buyTXValue"
                  ng-disabled="tx.readOnly || checkTxReadOnly"
                  ng-class="Validator.isPositiveNumber(buyTXValue) ? 'is-valid' : 'is-invalid'"
                  ng-change="changedTokens = buyTXValue * buyRate"/>
          <div class="input-group-btn">
            <span style="min-width: 170px"
                  class="btn btn-default"
                  ng-class="'disabled'">
                   <strong>
                     {{ changedTokens }} Libre
                   </strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Amount to Send - Transfer Entire Balance -->
      <p class="col-xs-12" ng-hide="tx.readOnly">
        <a ng-click="transferAllBalance()">
          <span class="strong" translate="SEND_TransferTotal">
            Send Entire Balance
          </span>
        </a>
      </p>

      <div class="col-sm-11">
        <span translate="LIBRE_buyRate">Last buy price</span>: {{ buyRate }} <span>LIBRE/ETH</span>
      </div>

      <div class="col-sm-4">
        <a style="min-width: 170px"
            class="btn btn-default"
            ng-click="generateBuyLibreTx()"
            ng-disabled="buyPending || !buyAllowed">
              {{ buyPending ? 'LIBRE_txPending' : 'LIBRE_buy' | translate }}
        </a>
      </div>

      <!-- REMISSION -->
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
                  ng-disabled="approvePending"
                  ng-click="generateApproveTx()">
                  <strong>
                    {{ approvePending ? 'LIBRE_txPending' : 'LIBRE_approve' | translate }}
                  </strong>
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
        

          <div class="col-sm-8 offset-col-sm-2">
              <a style="min-width: 170px"
                class="btn btn-default"
                ng-disabled="sellPending"
                ng-click="generateSellLibreTx()">
                <strong>
                  {{ sellPending ? 'LIBRE_txPending' : 'LIBRE_sell' | translate }}
                </strong>
              </a>
          </div>
        </div>
  
        <div class="col-sm-11">
          <span translate="LIBRE_sellRate">Sell rate</span>: {{ sellRate }} <span>LIBRE/ETH</span>
        </div>


      <!-- /REMISSION -->
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
