import { Component } from "@angular/core";
import { Router } from '@angular/router';
import { HeaderComponent } from "../../common/header/header.component";
import { FooterComponent } from "../../common/footer/footer.component";
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './ContactComponent.component.html',
})
export class ContactComponent {
  // Variabile per la visibilità del popup
  showMailPopup = false;

  constructor(private readonly router: Router) { }

  navigateTo(link: string) {
    return this.router.navigate(['/' + link]);
  }

  // Funzione per aprire il popup
  openMailPopup(event: MouseEvent) {
    event.preventDefault();  // Previene il comportamento predefinito del link
    this.showMailPopup = true;
  }

  // Funzione per chiudere il popup
  closeMailPopup() {
    this.showMailPopup = false;
  }

  // Funzione per aprire il client di posta selezionato
  openEmailClient(client: string) {
    const mailToLink = "mailto:andreabenassi02@gmail.com";

    switch (client) {
      case 'gmail':
        window.open('https://mail.google.com/mail/?view=cm&fs=1&to=andreabenassi02@gmail.com', '_blank');
        break;
      case 'outlook':
        window.open('https://outlook.live.com/mail/0/deeplink/compose?to=andreabenassi02@gmail.com', '_blank');
        break;
      case 'yahoo':
        window.open('https://compose.mail.yahoo.com/?to=andreabenassi02@gmail.com', '_blank');
        break;
      case 'other':
        window.location.href = mailToLink;
        break;
    }

    // Chiude il popup dopo la selezione
    this.closeMailPopup();
  }
}
