import { Component, OnInit, ElementRef } from '@angular/core';
import { NavbarService } from '../../services/navbar/navbar.service';
import { Room } from '../../types/room.type';

@Component({
    moduleId: module.id,
    selector: 'navbar',
    templateUrl: 'navbar.component.html',
    host: {
        '(document:click)': 'onClick($event)',
    }
})
export class NavbarComponent {
    rooms: Room[];
    navmenuHidden: boolean = false;
    mobileTitle: string;

    constructor(private navbarService: NavbarService, private _eref: ElementRef) { }

    ngOnInit() {
        // Get room array from service
        this.navbarService.rooms.subscribe(rooms => {
            this.rooms = rooms;
        });
        this.navbarService.getRooms();
        this.mobileTitle = 'ILECHAT';
    }

    // Hide menu if user clicks outside it
    onClick(event: any) {
        if (!this._eref.nativeElement.contains(event.target))
            this.navmenuHidden = false;
    }
}