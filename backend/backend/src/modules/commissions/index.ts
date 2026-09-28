// Commission Module - Sistema de Gestão de Comissões

import commissionRoutes from './commissionRoutes';
import CommissionService from './commissionService';

export { CommissionService };
export { default as commissionRoutes } from './commissionRoutes';

export default {
  CommissionService,
  commissionRoutes,
};