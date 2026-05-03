import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { AuthService } from "../auth.service";

@Controller("devices")
export class DeviceController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get()
  getDevices(@Req() req: { user: { userId: string } }) {
    return this.authService.getUserDevices(req.user.userId);
  }
}
