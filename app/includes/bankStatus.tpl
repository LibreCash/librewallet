<!-- Bank Status Page -->
<main class="tab-pane active" ng-if="globalService.currentTab==globalService.tabs.bankStatus.id" ng-controller='bankStatusCtrl' ng-cloak>

    <p>address: {{ address }}</p>
    <div class="row">
        <table class="table">
            <tr ng-repeat="(name, info) in contractData">
                <td translate="{{ info.translate }}">{{ info.default }}</td>
                <td>{{ info.data.error? info.data.message : info.data.data }}</td>
            </tr>
        </table>
        <table class="table">
            <tr ng-repeat="(address, info) in oracles">
                <td>{{ address }}</td>
                <td>{{ info.name }}</td>
                <td>{{ info.type }}</td>
                <td>{{ info.updateRate }}</td>
                <td>{{ info.enabled }}</td>
                <td>{{ info.waiting }}</td>
                <td>{{ info.rate }}</td>
            </tr>
        </table>
    </div>
</main>
<!-- / Bank Status Page -->
