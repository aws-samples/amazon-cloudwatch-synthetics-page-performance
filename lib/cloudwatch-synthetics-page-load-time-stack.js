const cdk = require('@aws-cdk/core');
const ssm = require('@aws-cdk/aws-ssm');
const synthetics = require('@aws-cdk/aws-synthetics');
const cloudwatch = require('@aws-cdk/aws-cloudwatch');
const actions = require('@aws-cdk/aws-cloudwatch-actions');
const iam = require('@aws-cdk/aws-iam');
const sns = require('@aws-cdk/aws-sns');
const snsSubscriptions = require('@aws-cdk/aws-sns-subscriptions');
const path = require('path');

class CloudwatchSyntheticsPageLoadTimeStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // To supply the code from your local filesystem:
    const canary = new synthetics.Canary(this, 'MyCanary', {
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      test: synthetics.Test.custom({
        code: synthetics.Code.fromAsset(path.join(__dirname, 'canary')),
        handler: 'index.handler', // must end with '.handler'
      }),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_2_0,
    });

    // add statement to allow writing metrics to cloudwatch
    canary.role.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'cloudwatch:PutMetricData'
      ],
      conditions: {
        StringEquals: {
          'cloudwatch:namespace': 'PagePerformance'
        }
      }
    }))

    // page URL provided as a CloudFormation parameter
    const pageLoadTimeURL = new cdk.CfnParameter(this, 'pageLoadTimeURL');

    // create SSM parameter with URL to measure
    const pageLoadTimeURLParam = new ssm.StringParameter(this, 'Parameter', {
      allowedPattern: '.*',
      description: 'URL to measure page load time',
      parameterName: 'PageLoadTimeURL',
      stringValue: pageLoadTimeURL,
      tier: ssm.ParameterTier.ADVANCED,
    });

    pageLoadTimeURLParam.grantRead(canary.role);

    const metric = new cloudwatch.Metric({
      namespace: 'PagePerformance',
      metricName: 'PageLoadTime',
      dimensions: { URL: pageLoadTimeURL }
    });

    // create alarm when threshold above 6 seconds
    const alarm = metric.createAlarm(this, 'PageLoadTimeAlarm', {
      threshold: 6000,
      evaluationPeriods: 3,
      datapointsToAlarm: 2
    });

    const pageLoadTopic = new sns.Topic(this, 'PageLoadTimeTopic');

    alarm.addAlarmAction(new actions.SnsAction(pageLoadTopic));

    // email provided as a CloudFormation parameter
    const emailAddress = new cdk.CfnParameter(this, 'subscriptionEmail');

    // create subscription to the provided email
    pageLoadTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(
        emailAddress.value.toString(),
      ),
    );
  }
}

module.exports = { CloudwatchSyntheticsPageLoadTimeStack }
