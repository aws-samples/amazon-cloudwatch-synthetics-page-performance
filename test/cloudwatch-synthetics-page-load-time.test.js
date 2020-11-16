const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const CloudwatchSyntheticsPageLoadTime = require('../lib/cloudwatch-synthetics-page-load-time-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CloudwatchSyntheticsPageLoadTime.CloudwatchSyntheticsPageLoadTimeStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
