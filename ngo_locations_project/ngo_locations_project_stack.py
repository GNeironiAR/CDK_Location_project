from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class NGOLocationsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # DynamoDB table para almacenar las ubicaciones
        locations_table = dynamodb.Table(
            self, 'NGOLocations',
            partition_key=dynamodb.Attribute(
                name='id',
                type=dynamodb.AttributeType.STRING
            ),
            removal_policy=RemovalPolicy.DESTROY,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # Lambda functions
        get_locations = lambda_.Function(
            self, 'GetLocationsHandler',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='get_locations.handler',
            code=lambda_.Code.from_asset('lambda'),
            environment={
                'TABLE_NAME': locations_table.table_name
            }
        )

        create_location = lambda_.Function(
            self, 'CreateLocationHandler',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='create_location.handler',
            code=lambda_.Code.from_asset('lambda'),
            environment={
                'TABLE_NAME': locations_table.table_name
            }
        )

        delete_location = lambda_.Function(
            self, 'DeleteLocationHandler',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='delete_location.handler',
            code=lambda_.Code.from_asset('lambda'),
            environment={
                'TABLE_NAME': locations_table.table_name
            }
        )

        update_location = lambda_.Function(
            self, 'UpdateLocationHandler',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='update_location.handler',
            code=lambda_.Code.from_asset('lambda'),
            environment={
                'TABLE_NAME': locations_table.table_name
            }
        )

        # Dar permisos a las funciones Lambda para acceder a DynamoDB
        locations_table.grant_read_write_data(get_locations)
        locations_table.grant_read_write_data(create_location)
        locations_table.grant_read_write_data(delete_location)
        locations_table.grant_read_write_data(update_location)

        # API Gateway REST API
        api = apigateway.RestApi(
            self, 'NGOLocationsApi',
            rest_api_name='NGO Locations API',
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=['*'],
                allow_methods=['GET', 'POST', 'PUT', 'DELETE'],
                allow_headers=['*']
            )
        )

        locations = api.root.add_resource('locations')
        locations.add_method('GET', apigateway.LambdaIntegration(get_locations))
        locations.add_method('POST', apigateway.LambdaIntegration(create_location))
        
        location = locations.add_resource('{id}')
        location.add_method('DELETE', apigateway.LambdaIntegration(delete_location))
        location.add_method('PUT', apigateway.LambdaIntegration(update_location))

        # S3 bucket para el frontend con configuración segura
        website_bucket = s3.Bucket(
            self, 'WebsiteBucket',
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True  # Añadido versionamiento
        )

        # CloudFront Origin Access Identity
        origin_access_identity = cloudfront.OriginAccessIdentity(
            self, 'WebsiteDistributionOAI',
            comment="OAI for NGO Locations website"
        )

        # Dar permisos a CloudFront para acceder al bucket
        website_bucket.grant_read(origin_access_identity)

        # CloudFront distribution
        distribution = cloudfront.Distribution(
            self, 'WebsiteDistribution',
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    website_bucket,
                    origin_access_identity=origin_access_identity
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            ),
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path='/index.html'
                )
            ]
        )

        # S3 deployment como parte del stack CDK
        s3_deployment.BucketDeployment(
            self, 'WebsiteDeployment',
            sources=[s3_deployment.Source.asset('./frontend/dist')],
            destination_bucket=website_bucket,
            distribution=distribution,
            distribution_paths=['/*'],
            memory_limit=1024,  # Aumentado el límite de memoria
            prune=False  # No eliminar archivos existentes
        )

        # Output values
        CfnOutput(self, 'ApiUrl', 
                 value=f"{api.url}locations",
                 description='URL del API Gateway')
        CfnOutput(self, 'CloudFrontUrl', 
                 value=f"https://{distribution.domain_name}",  # Cambiado a domain_name
                 description='URL de CloudFront')
        CfnOutput(self, 'BucketName',
                 value=website_bucket.bucket_name,
                 description='Nombre del bucket S3')