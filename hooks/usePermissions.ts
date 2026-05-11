
import { useCrm } from './useCrm';
import { ModuleName, PermissionAction } from '../types';

export const usePermissions = () => {
    const { currentUser, roles } = useCrm();
    
    const can = (module: ModuleName, action: PermissionAction): boolean => {
        if (!currentUser) {
            return false;
        }
        
        const roleName = String(currentUser.role).toLowerCase();

        // 1. Root Level Overrides - System Integrity Protection
        if (roleName === 'super admin' || roleName === 'admin') {
            return true;
        }

        // 2. Look up permissions from the associated role
        const userRole = roles.find(r => String(r.id) === String(currentUser.roleId));
        
        if (!userRole || !userRole.permissions) {
            // Fallback to direct permissions on user if role not found (legacy or special cases)
            const rawPermissions = (currentUser as any).permissions;
            if (!rawPermissions) return false;
            
            let permissions: any = {};
            try {
                permissions = typeof rawPermissions === 'string' ? JSON.parse(rawPermissions) : rawPermissions;
            } catch (e) {
                return false;
            }
            const modulePerms = permissions[module];
            return Array.isArray(modulePerms) && modulePerms.includes(action);
        }

        // 3. Module-specific evaluation from Role
        const permissions = userRole.permissions as any;
        const modulePerms = permissions[module];
        
        if (!modulePerms || !Array.isArray(modulePerms)) {
            return false;
        }

        return modulePerms.includes(action);
    };

    return { can };
};
