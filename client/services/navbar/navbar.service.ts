import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Room } from '../../types/room.type';
import 'rxjs/add/operator/map';

@Injectable()
export class NavbarService {
    // Subscribable room list so that new rooms can be added dynamically to menu
    rooms: Observable<Room[]>;
    private _rooms: BehaviorSubject<Room[]>;
    private roomStore: {
        rooms: Room[];
    }


    constructor(private http: Http) {
        console.log('Navbar service initialized');
        this.roomStore = { rooms: [] };
        this._rooms = new BehaviorSubject([]);
        this.rooms = this._rooms.asObservable();
    }

    // Get all rooms from api
    getRooms() {
        this.http.get('/api/get-rooms')
            .map(res => res.json()).subscribe(rooms => {
                this.roomStore.rooms = rooms;
                this._rooms.next(Object.assign({}, this.roomStore).rooms);
        });
    }

    // Add room to service's Observable array
    addRoom(room: Room) {
        this.roomStore.rooms.push(room);
        this._rooms.next(Object.assign({}, this.roomStore).rooms);
    }
}