#!/usr/bin/env python3
import os
import aws_cdk as cdk
from ngo_locations_project.ngo_locations_project_stack import NGOLocationsStack

app = cdk.App()
NGOLocationsStack(app, "NgoLocationsProjectStack",
    env=cdk.Environment(
        account='774305612344',
        region='us-east-1'
    )
)

app.synth()
