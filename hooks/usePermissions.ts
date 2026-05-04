
import { useCrm } from './useCrm';
import { ModuleName, PermissionAction } from '../types';

export const usePermissions = () => {
    const { currentUser } = useCrm();
    
    const can = (module: ModuleName, action: PermissionAction): boolean => {
        if (!currentUser) {
            return false;
        }
        
        const roleName = String(currentUser.role).toLowerCase();

        // 1. Root Level Overrides - System Integrity Protection
        if (roleName === 'super admin' || roleName === 'admin') {
            return true;
        }

        // 2. Direct Permission Check
        const rawPermissions = (currentUser as any).permissions;

        if (!rawPermissions) {
            return false;
        }

        // 3. Robust Data Parsing
        let permissions: any = {};
        try {
            permissions = typeof rawPermissions === 'string' ? JSON.parse(rawPermissions) : rawPermissions;
        } catch (e) {
            console.error("[Permissions] Critical: Invalid format for user permissions set.", rawPermissions);
            return false;
        }

        // 4. Module-specific evaluation
        const modulePerms = permissions[module];
        
        if (!modulePerms || !Array.isArray(modulePerms)) {
            return false;
        }

        return modulePerms.includes(action);
    };

    return { can };
};
