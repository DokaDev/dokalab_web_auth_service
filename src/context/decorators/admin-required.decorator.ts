import { SetMetadata } from '@nestjs/common';

export const ADMIN_REQUIRED_KEY = 'adminRequired';
export const AdminRequired = () => SetMetadata(ADMIN_REQUIRED_KEY, true);
