/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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
import { Button } from '@patternfly/react-core';
import { ThumbsUpIcon } from '@patternfly/react-icons';

import { Artifact } from '../../types';
import { createWaiver } from '../../actions';
import { useAppDispatch } from '../../hooks';
import { CiTest } from './types';

export interface WaiveButtonProps {
    artifact: Artifact;
    ciTest: CiTest;
}

/**
 * Provide a waive function button which opens the waive form pop-up when clicked.
 * This is pretty much a clone of the `WaiveButton` component from
 * `ArtifactGreenwaveState.tsx` but with a different styling for the new page.
 */
export const WaiveButton: React.FC<WaiveButtonProps> = (props) => {
    const { artifact, ciTest } = props;
    const dispatch = useAppDispatch();

    if (_.isEmpty(ciTest.name)) return null;
    const onClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        dispatch(createWaiver(artifact, ciTest));
    };

    return (
        <Button icon={<ThumbsUpIcon />} onClick={onClick} variant="link">
            Waive
        </Button>
    );
};
