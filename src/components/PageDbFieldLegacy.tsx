/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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

import _ from 'lodash';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { actArtTypes, actQueryString } from './../actions';

type RouterParams = 'search' | 'type' | 'value';

export function PageDbFieldLegacy(_props: {}) {
    const legacyMapping = {
        'brew-build': {
            aid: 'taskId',
        },
        'koji-build': {
            aid: 'taskId',
        },
    };
    const params = useParams<RouterParams>();
    const dispatch = useAppDispatch();
    const to = '/search';
    const artifactType = params.type || '';
    const fieldNameLegacy = params.search || '';
    const fieldName = _.get(
        legacyMapping,
        [artifactType, fieldNameLegacy],
        fieldNameLegacy,
    );
    const fieldValues = params.value?.split(' OR ') || [];
    let artTypes = [artifactType];
    const queryString = `${fieldName}: (${fieldValues})`;
    if (_.isEmpty(artTypes)) {
        artTypes = [''];
    }
    const navigate = useNavigate();
    useEffect(() => {
        dispatch(actQueryString(queryString));
        dispatch(actArtTypes(artTypes));
        navigate(to);
    }, []);
    return null;
}
