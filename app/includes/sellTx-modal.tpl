<article class="modal fade" id="sellTx" tabindex="-1">
  <section class="modal-dialog">
    <section class="modal-content">

      <div class="modal-body">

        <button type="button" class="close" data-dismiss="modal" aria-label="Close Dialog">&times;</button>

        <h2 class="modal-title text-center">
            {{tokenValue}} Libre -> {{changedEth}} ETH
        </h2>

        <br />

        <table class="table small table-condensed table-hover">
          <tbody>
            <tr>
              <td class="small text-right">Sell rate:</td>
              <td class="small text-left mono">{{sellRate}} Libre/ETH</td>
            </tr>
            <tr>
              <td class="small text-right">Account Balance:</td>
              <td class="small text-left mono">{{wallet.balance}}</td>
            </tr>
            <tr>
              <td class="small text-right">Gas Limit:</td>
              <td class="small text-left mono">{{remissionLimit}}</td>
            </tr>
            <tr>
              <td class="small text-right">Gas Price:</td>
              <td class="small text-left mono">{{gasPrice.gwei}} GWEI</small>
              </td>
            </tr>
            <tr>
              <td class="small text-right">Max TX Fee:</td>
              <td class="small text-left mono"> {{txFees.Remission}} ETH</td>
            </tr>

          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <p translate="SENDModal_Content_3">
          Are you sure you want to do this?
        </p>
        <br />
        <button class="btn btn-default" data-dismiss="modal" translate="SENDModal_No">
          Yes, confirm
        </button>
        <button class="btn btn-primary" ng-click="generateSellLibreTx()" translate="SENDModal_Yes">
          No, cancel
        </button>
      </div>

      <p class="small text-center" style="padding: 0px 5px;">
        <a href="https://myetherwallet.github.io/knowledge-base/transactions/transactions-not-showing-or-pending.html" target="_blank" ref="noopener noreferrer">
          The network is a bit overloaded. If you're having issues with TXs, please read me.
        </a>
      </p>



    </section>
  </section>
</article>
