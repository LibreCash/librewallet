<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>

    @@if (site === 'cx' ) {  @@include( './bankStatus-content.tpl', { "site": "cx" } )    }
    @@if (site === 'mew') {  @@include( './bankStatus-content.tpl', { "site": "mew" } )   }
{{ data0 }}
</main>
<!-- / Bank Status Page -->
