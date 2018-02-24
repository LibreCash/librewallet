<article class="modal fade" id="urTx" tabindex="-1">
  <section class="modal-dialog">
    <section class="modal-content">

      <div class="modal-body">

        <button type="button" class="close" data-dismiss="modal" aria-label="Close Dialog">&times;</button>

        <h2 class="modal-title text-center">
            requestRates()
        </h2>

        <table class="table small table-condensed table-hover">
          <tbody>
            <tr>
              <td class="small text-right">Method cost:</td>
              <td class="small text-left mono">{{updateRatesCost}} ETH</td>
            </tr>
            <tr>
              <td class="small text-right">Account Balance:</td>
              <td class="small text-left mono">{{wallet.balance}}</td>
            </tr>
            <tr>
              <td class="small text-right">Gas Price:</td>
              <td class="small text-left mono">{{gasPrice.gwei}} GWEI</td>
            </tr>
            <tr>
              <td class="small text-right">Estimated Gas:</td>
              <td class="small text-left mono">{{updateRatesEstimatedGas}}</td>
            </tr>
            <tr>
              <td class="small text-right">Maximum Gas:</td>
              <td class="small text-left mono">{{updateRatesLimit}}</td>
            </tr>
            <tr>
              <td class="small text-right">Estimated TX Fee:</td>
              <td class="small text-left mono">{{txFees.updateRatesEstimated}} ETH</td>
            </tr>  
            <tr>
              <td class="small text-right">Maximum TX Fee:</td>
              <td class="small text-left mono">{{txFees.updateRates}} ETH</td>
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
          No, get me out of here!
        </button>
        <button class="btn btn-primary" ng-click="generateUpdateRatesTx()" translate="SENDModal_Yes">
          Yes, I am sure! Make transaction.
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
