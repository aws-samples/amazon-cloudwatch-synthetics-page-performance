#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { CloudwatchSyntheticsPageLoadTimeStack } = require('../lib/cloudwatch-synthetics-page-load-time-stack');

const app = new cdk.App();
new CloudwatchSyntheticsPageLoadTimeStack(app, 'CloudwatchSyntheticsPageLoadTimeStack');
