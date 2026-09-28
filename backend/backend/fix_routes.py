"import sys
file_path = 'src/modules/drivers/driverAppRoutes.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the import
old_import = \"import { (req as any).user } from '../../shared/types';\"
new_import = \"import type { AuthenticatedRequest } from '../../shared/types';\"

if old_import in content:
    content = content.replace(old_import, new_import)
    print('✅ Fixed import')
else:
    print('⚠️ Old import not found')

# Fix the user variable assignment
old_var = 'const authUser = (req as any).user(req);'
new_var = 'const authUser = (req as any).user;'

if old_var in content:
    content = content.replace(old_var, new_var)
    print('✅ Fixed authUser variable')
else:
    # Try alternative patterns
    if 'const authUser = (req as any).user(req)' in content:
        content = content.replace('const authUser = (req as any).user(req)', 'const authUser = (req as any).user')
        print('✅ Fixed authUser variable (alt)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Done!')

# Verify
print('  Import has AuthenticatedRequest:', 'AuthenticatedRequest' in content)
print('  No getAuthenticatedUser:', 'getAuthenticatedUser' not in content)
print('  No requireAuth:', 'requireAuth' not in content)
print('  Has verifyFirebaseToken:', 'verifyFirebaseToken' in content)
print('  Has ensureUserId:', 'ensureUserId' in content)
"