
export AWS_PROFILE=cdk-profile
export AWS_REGION=us-east-1

# activar ambiente virtual.
source .venv/bin/activate

# asegurar que los requerimientos esten instalados
pip install -r requirements.txt

# boostrap del CDK (solo una vez por cuenta por region)
cdk bootstrap aws://774305612344/us-east-1 --profile cdk-profile

# deploy 
cd frontend
npm run build
cd ..
1- cdk deploy --profile cdk-profile
2- aws cloudformation list-stacks --query "StackSummaries[?StackStatus!='DELETE_COMPLETE'].[StackName,StackStatus]" --output table


# destroy /utils
1- cdk destroy --all --force


# project structure:
tree -I 'venv|node_modules|cdk.out|__pycache__' > project_structure.txt