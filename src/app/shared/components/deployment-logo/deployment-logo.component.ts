import { Component, OnInit, Input } from '@angular/core';
import { DeploymentConfigService } from '../../services/deployment-config.service';

@Component({
  selector: 'app-deployment-logo',
  templateUrl: './deployment-logo.component.html',
  styleUrls: ['./deployment-logo.component.css']
})
export class DeploymentLogoComponent implements OnInit {
  @Input() showName: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  logo: string;
  name: string;
  
  constructor(private deploymentConfigService: DeploymentConfigService) { }

  ngOnInit(): void {
    this.deploymentConfigService.config$.subscribe(config => {
      if (config) {
        this.logo = config.logo;
        this.name = config.name;
      }
    });
  }

  get logoClass(): string {
    return `logo-${this.size}`;
  }
} 