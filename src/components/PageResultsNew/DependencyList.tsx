/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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

import * as _ from 'lodash';
import { List, ListItem } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';

import './index.css';
import { MetadataDependency } from '../../types';

interface DependencyItemProps {
    dependency: MetadataDependency;
}

function DependencyItem({ dependency }: DependencyItemProps) {
    const prefix =
        dependency.dependency === 'is_required'
            ? 'Depends on'
            : 'Is related to';

    return (
        <ListItem title={dependency.comment || undefined}>
            {prefix} <b>{dependency.testcase_name}</b>
            {dependency.comment && (
                <QuestionCircleIcon className="pf-u-ml-xs" />
            )}
        </ListItem>
    );
}

export interface DependencyListProps {
    dependencies?: MetadataDependency[];
}

/**
 * Render a list of dependencies and related test for display in results table.
 */
export function DependencyList({ dependencies }: DependencyListProps) {
    if (!dependencies || _.isEmpty(dependencies)) return null;

    let items = dependencies.map((dependency) => (
        <DependencyItem dependency={dependency} />
    ));

    return (
        <List className="dependencyList" component="ul">
            {items}
        </List>
    );
}
