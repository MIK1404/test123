// Post Terraform Plan results to PR with detailed error suggestions
module.exports = async ({ github, context, outcomes }) => {
  const fs = require('fs');
  const path = require('path');
  
  // Check each step's outcome
  const azureLoginFailed = outcomes.azureLogin === 'failure';
  const initFailed = outcomes.init === 'failure';
  const validateFailed = outcomes.validate === 'failure';
  const planFailed = outcomes.plan === 'failure';
  
  const planPath = path.join(process.cwd(), 'abc', 'plan.txt');
  let planOutput = '';
  try {
    if (fs.existsSync(planPath)) {
      planOutput = fs.readFileSync(planPath, 'utf8');
    }
  } catch (e) {
    console.log(`Error reading plan: ${e.message}`);
  }
  
  const hasNoChanges = planOutput.includes('No changes') || planOutput.includes('no resources need to be destroyed');
  const isSuccess = !azureLoginFailed && !initFailed && !validateFailed && !planFailed && (planOutput.includes('will be') || hasNoChanges);
  
  let comment = '';
  
  if (isSuccess) {
    // Success message
    comment = `## ✅ Terraform Plan Succeeded\n\n<details><summary>📄 View Plan Output</summary>\n\n\`\`\`\n${planOutput}\n\`\`\`\n\n</details>`;
  } else {
    // Failure - show each step that failed
    comment = `## 🔴 Terraform Execution Failed\n\n[View full logs →](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})\n\n`;
    
    // Azure Login failure
    if (azureLoginFailed) {
      comment += `### ❌ Step 1: Azure Login Failed\n\n`;
      comment += `**Issue:** GitHub Secrets not configured for Azure authentication.\n\n`;
      comment += `**Solution:**\n`;
      comment += `1. Get Azure Credentials:\n`;
      comment += `   \`\`\`bash\n`;
      comment += `   az ad sp create-for-rbac --name "terraform-github" --role Contributor\n`;
      comment += `   \`\`\`\n`;
      comment += `2. Add GitHub Secrets (Settings → Secrets and variables → Actions):\n`;
      comment += `   - \`AZURE_CLIENT_ID\` = clientId from command output\n`;
      comment += `   - \`AZURE_TENANT_ID\` = tenant from command output\n`;
      comment += `   - \`AZURE_SUBSCRIPTION_ID\` = your subscription ID (\`az account show --query id\`)\n\n`;
    }
    
    // Terraform Init failure
    if (initFailed) {
      comment += `### ❌ Step 2: Terraform Init Failed\n\n`;
      comment += `**Issue:** Failed to initialize Terraform in ./abc directory.\n\n`;
      comment += `**Solution:**\n`;
      comment += `- Verify all .tf files exist in ./abc\n`;
      comment += `- Check provider.tf has correct \`required_providers\` block\n`;
      comment += `- Ensure terraform.tfvars exists\n`;
      comment += `- Run locally: \`cd abc && terraform init\`\n\n`;
    }
    
    // Terraform Validate failure
    if (validateFailed) {
      comment += `### ❌ Step 3: Terraform Validate Failed\n\n`;
      comment += `**Issue:** Terraform configuration has syntax or structure errors.\n\n`;
      comment += `**Solution:**\n`;
      comment += `- Check for syntax errors in main.tf, variables.tf, provider.tf\n`;
      comment += `- Ensure all variable references are correct\n`;
      comment += `- Run locally: \`cd abc && terraform validate\`\n`;
      comment += `- Look for missing required variables or incorrect types\n\n`;
    }
    
    // Terraform Plan failure
    if (planFailed) {
      comment += `### ❌ Step 4: Terraform Plan Failed\n\n`;
      comment += `**Issue:** Terraform plan execution encountered an error.\n\n`;
      comment += `**Error Output:**\n`;
      comment += `\`\`\`\n${planOutput || 'Check Actions logs for details'}\n\`\`\`\n\n`;
      comment += `**Common Causes:**\n`;
      comment += `- Invalid resource configuration\n`;
      comment += `- Missing or incorrect variable values in terraform.tfvars\n`;
      comment += `- Azure resource quota exceeded\n`;
      comment += `- Invalid resource names or properties\n\n`;
    }
    
    comment += `### 📋 Troubleshooting\n\n`;
    comment += `1. Check the [full workflow logs](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) for detailed error messages\n`;
    comment += `2. Test locally:\n`;
    comment += `   \`\`\`bash\n`;
    comment += `   cd abc\n`;
    comment += `   terraform init\n`;
    comment += `   terraform validate\n`;
    comment += `   terraform plan\n`;
    comment += `   \`\`\`\n`;
    comment += `3. Fix the error and push again\n`;
  }
  
  await github.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: comment
  });
};
