/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021-2022 Andrei Stepanov <astepano@redhat.com>
 * Copyright (c) 2021 Matěj Grabovský <mgrabovs@redhat.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { IStateAlerts } from '../actions/types';

import { alertsReducer, popAlert, pushAlert } from './alertsSlice';

test('PUSH adds an alert', () => {
    const state: IStateAlerts = {
        alerts: [
            { key: 1, title: 'First alert', variant: 'info' },
            { key: 2, title: 'Second alert', variant: 'danger' },
        ],
    };
    const action = pushAlert({ key: 3, title: 'New alert', variant: 'info' });
    const newState = alertsReducer(state, action);
    expect(newState).toStrictEqual({
        alerts: [
            { key: 1, title: 'First alert', variant: 'info' },
            { key: 2, title: 'Second alert', variant: 'danger' },
            { key: 3, title: 'New alert', variant: 'info' },
        ],
    });
});

test('POP removes an alert', () => {
    const state: IStateAlerts = {
        alerts: [
            { key: 1, title: 'First alert', variant: 'info' },
            { key: 2, title: 'Second alert', variant: 'danger' },
            { key: 3, title: 'New alert', variant: 'info' },
        ],
    };
    const action = popAlert({ key: 2 });
    const newState = alertsReducer(state, action);
    expect(newState).toStrictEqual({
        alerts: [
            { key: 1, title: 'First alert', variant: 'info' },
            { key: 3, title: 'New alert', variant: 'info' },
        ],
    });
});

test('POP does not remove a non-existent alert', () => {
    const state: IStateAlerts = {
        alerts: [
            { key: 1, title: 'First alert', variant: 'info' },
            { key: 2, title: 'Second alert', variant: 'danger' },
            { key: 3, title: 'New alert', variant: 'info' },
        ],
    };
    const action = popAlert({ key: 246 });
    const newState = alertsReducer(state, action);
    expect(newState).toStrictEqual(state);
});
