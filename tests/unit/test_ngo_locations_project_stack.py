import aws_cdk as core
import aws_cdk.assertions as assertions

from ngo_locations_project.ngo_locations_project_stack import NgoLocationsProjectStack

# example tests. To run these tests, uncomment this file along with the example
# resource in ngo_locations_project/ngo_locations_project_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = NgoLocationsProjectStack(app, "ngo-locations-project")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
