/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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
import * as React from 'react';
import {
    Reducer,
    useState,
    useEffect,
    useContext,
    useReducer,
    createContext,
    FunctionComponent,
    MouseEventHandler,
} from 'react';
import validator from 'validator';
import update from 'immutability-helper';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useMutation, useLazyQuery } from '@apollo/client';
import {
    Form,
    Button,
    Popover,
    TextArea,
    Checkbox,
    FormGroup,
    TextInput,
    FormSelect,
    ActionGroup,
    FormSelectOption,
    FormFieldGroup,
    FormFieldGroupHeader,
} from '@patternfly/react-core';
import {
    Tr,
    Th,
    Td,
    Tbody,
    Thead,
    TableComposable,
} from '@patternfly/react-table';
import {
    HelpIcon,
    TrashIcon,
    ExclamationCircleIcon,
} from '@patternfly/react-icons';

import { config } from '../config';
import { PageCommon } from './PageCommon';
import { MetadataUpdate } from '../mutations/Metadata';
import { MetadataRawQuery } from '../queries/Metadata';
import { KnownIssue, Dependency, APIError, Contact } from './PageMetadataList';

type Validate = 'success' | 'warning' | 'error' | 'default';

const severityItems = [
    { value: 'blocker', label: 'Blocker' },
    { value: 'critical', label: 'Critical' },
    { value: 'major', label: 'Major' },
    { value: 'normal', label: 'Normal', isPlaceholder: true },
    { value: 'minor', label: 'Minor' },
];

const statusItems = [
    { value: 'active', label: 'Active', isPlaceholder: true },
    { value: 'fixed', label: 'Fixed' },
    { value: 'irrelevant', label: 'Irrelevant' },
];

const dependencyItems = [
    { value: 'is_required', label: 'Is required', disabled: false },
    { value: 'is_related_to', label: 'Is related to', disabled: false },
];

interface SeveritySelectProps {
    issue: KnownIssue;
}
export const SeveritySelect: React.FunctionComponent<SeveritySelectProps> = (
    props,
) => {
    const { issue } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        const updatedIssue: KnownIssue = _.assign({}, issue, {
            severity: value,
        });
        dispatch({ type: 'updateIssue', issue, updatedIssue });
    };
    return (
        <FormSelect
            value={issue.severity}
            onChange={onChange}
            aria-label="Severity Select"
        >
            {severityItems.map((option, index) => (
                <FormSelectOption
                    key={index}
                    value={option.value}
                    label={option.label}
                    isPlaceholder={option.isPlaceholder}
                />
            ))}
        </FormSelect>
    );
};

interface StatusSelectProps {
    issue: KnownIssue;
}
export const StatusSelect: React.FunctionComponent<StatusSelectProps> = (
    props,
) => {
    const { issue } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        const updatedIssue: KnownIssue = _.assign({}, issue, {
            status: value,
        });
        dispatch({ type: 'updateIssue', issue, updatedIssue });
    };
    return (
        <FormSelect
            value={issue.status}
            onChange={onChange}
            aria-label="Status Select"
        >
            {statusItems.map((option, index) => (
                <FormSelectOption
                    key={index}
                    value={option.value}
                    label={option.label}
                    isPlaceholder={option.isPlaceholder}
                />
            ))}
        </FormSelect>
    );
};

interface IssueInfoProps {
    issue: KnownIssue;
}
export const IssueInfo: FunctionComponent<IssueInfoProps> = (props) => {
    const { issue } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        const updatedIssue: KnownIssue = _.assign({}, issue, { info: value });
        dispatch({ type: 'updateIssue', issue, updatedIssue });
    };
    return (
        <TextInput
            type="text"
            value={issue.info}
            onChange={onChange}
            aria-label="known issue info"
        />
    );
};

interface DepTestcaseProps {
    dependency: Dependency;
}
export const DepTestcase: FunctionComponent<DepTestcaseProps> = (props) => {
    const { dependency } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        const updatedDependency: Dependency = _.assign({}, dependency, {
            testcase_name: value,
        });
        dispatch({ type: 'updateDependency', dependency, updatedDependency });
    };
    return (
        <TextInput
            placeholder="osci.brew-build./plans/tier1-internal.functional"
            type="text"
            value={dependency.testcase_name}
            onChange={onChange}
            aria-label="dependency testcase name"
        />
    );
};

interface DepCommentProps {
    dependency: Dependency;
}
export const DepComment: FunctionComponent<DepCommentProps> = (props) => {
    const { dependency } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        const updatedDependency: Dependency = _.assign({}, dependency, {
            comment: value,
        });
        dispatch({ type: 'updateDependency', dependency, updatedDependency });
    };
    return (
        <TextInput
            placeholder="explain dependency"
            type="text"
            value={dependency.comment}
            onChange={onChange}
            aria-label="dependency comment"
        />
    );
};

interface IssueRemoveProps {
    issue: KnownIssue;
}
export const IssueRemove: FunctionComponent<IssueRemoveProps> = (props) => {
    const { issue } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onClick: MouseEventHandler = () => {
        dispatch({ type: 'rmIssue', issue });
    };
    return (
        <Button
            variant="plain"
            isInline
            icon={<TrashIcon />}
            onClick={onClick}
        />
    );
};

interface DependencyRemoveProps {
    dependency: Dependency;
}
export const DependencyRemove: FunctionComponent<DependencyRemoveProps> = (
    props,
) => {
    const { dependency } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onClick: MouseEventHandler = () => {
        dispatch({ type: 'rmDependency', dependency });
    };
    return (
        <Button
            variant="plain"
            isInline
            icon={<TrashIcon />}
            onClick={onClick}
        />
    );
};

interface FormGroupKnownIssuesProps {
    issues?: KnownIssue[];
}
export const FormGroupKnownIssues: FunctionComponent<
    FormGroupKnownIssuesProps
> = (props) => {
    const { issues } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onClickAddNew: MouseEventHandler = () => {
        dispatch({ type: 'newIssue' });
    };
    const columnNames = {
        info: 'Info',
        status: 'Status',
        severity: 'Severity',
        remove: 'Remove',
    };
    const element = (
        <FormGroup
            role="group"
            isInline
            fieldId="form-known-issues-group"
            label="Known issues"
        >
            <TableComposable
                isStriped
                aria-label="Actions table"
                variant="compact"
            >
                <Thead noWrap>
                    <Tr>
                        <Th>{columnNames.info}</Th>
                        <Th>{columnNames.status}</Th>
                        <Th>{columnNames.severity}</Th>
                        <Th>{columnNames.remove}</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {_.isArray(issues) &&
                        issues.map((issue, index) => (
                            <Tr key={index}>
                                <Td
                                    width={50}
                                    modifier="nowrap"
                                    dataLabel={columnNames.info}
                                    isActionCell
                                >
                                    <IssueInfo issue={issue} />
                                </Td>
                                <Td
                                    isActionCell
                                    width={20}
                                    dataLabel={columnNames.status}
                                >
                                    <StatusSelect issue={issue} />
                                </Td>
                                <Td
                                    width={20}
                                    isActionCell
                                    dataLabel={columnNames.severity}
                                >
                                    <SeveritySelect issue={issue} />
                                </Td>
                                <Td
                                    width={10}
                                    isActionCell
                                    dataLabel={columnNames.remove}
                                >
                                    <IssueRemove issue={issue} />
                                </Td>
                            </Tr>
                        ))}
                </Tbody>
            </TableComposable>
            <Button variant="secondary" type="button" onClick={onClickAddNew}>
                Add new known issue
            </Button>
        </FormGroup>
    );

    return element;
};

interface FormGroupDependencyProps {
    dependencies?: Dependency[];
}
export const FormGroupDependency: FunctionComponent<
    FormGroupDependencyProps
> = (props) => {
    const { dependencies } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onClickAddNew: MouseEventHandler = () => {
        dispatch({ type: 'newDependency' });
    };
    const columnNames = {
        testcase: 'Testcase name',
        dependency: 'Dependency',
        comment: 'Details',
        remove: 'Remove',
    };
    const element = (
        <FormGroup
            role="group"
            isInline
            fieldId="form-dependencies-group"
            label="Relations to other tests"
        >
            <TableComposable
                isStriped
                aria-label="Actions table"
                variant="compact"
            >
                <Thead noWrap>
                    <Tr>
                        <Th>{columnNames.testcase}</Th>
                        <Th>{columnNames.dependency}</Th>
                        <Th>{columnNames.comment}</Th>
                        <Th>{columnNames.remove}</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {_.isArray(dependencies) &&
                        dependencies.map((dependency, index) => (
                            <Tr key={index}>
                                <Td
                                    width={45}
                                    modifier="nowrap"
                                    dataLabel={columnNames.testcase}
                                    isActionCell
                                >
                                    <DepTestcase dependency={dependency} />
                                </Td>
                                <Td
                                    isActionCell
                                    width={25}
                                    dataLabel={columnNames.dependency}
                                >
                                    <DependencySelect dependency={dependency} />
                                </Td>
                                <Td
                                    width={20}
                                    modifier="nowrap"
                                    dataLabel={columnNames.testcase}
                                    isActionCell
                                >
                                    <DepComment dependency={dependency} />
                                </Td>
                                <Td
                                    width={10}
                                    isActionCell
                                    dataLabel={columnNames.remove}
                                >
                                    <DependencyRemove dependency={dependency} />
                                </Td>
                            </Tr>
                        ))}
                </Tbody>
            </TableComposable>
            <Button variant="secondary" type="button" onClick={onClickAddNew}>
                Add a new dependency
            </Button>
        </FormGroup>
    );

    return element;
};

interface DependencySelectProps {
    dependency: Dependency;
}
export const DependencySelect: React.FunctionComponent<
    DependencySelectProps
> = (props) => {
    const { dependency } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        const updatedDependency: Dependency = _.assign({}, dependency, {
            dependency: value,
        });
        dispatch({ type: 'updateDependency', dependency, updatedDependency });
    };
    return (
        <FormSelect
            value={dependency.dependency}
            onChange={onChange}
            aria-label="Dependency select"
        >
            {dependencyItems.map((option, index) => (
                <FormSelectOption
                    isDisabled={option.disabled}
                    key={index}
                    value={option.value}
                    label={option.label}
                />
            ))}
        </FormSelect>
    );
};

interface FormGroupTestcaseProps {
    isRegex?: boolean;
    testcaseName?: string;
}
const FormGroupTestcase: FunctionComponent<FormGroupTestcaseProps> = (
    props,
) => {
    const testcaseName = _.defaultTo(props.testcaseName, '');
    const isRegex = _.defaultTo(props.isRegex, false);
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const checkboxChange = (
        checked: boolean,
        event: React.FormEvent<HTMLInputElement>,
    ) => {
        const target = event.currentTarget;
        const name = target.name;
        switch (name) {
            case 'is-regex':
                dispatch({ type: 'testcaseNameIsRegex', isRegex: checked });
                break;
            default:
                console.log('Unexpected component', name);
        }
    };
    const handleNameChange = (testcaseName: string) => {
        dispatch({ type: 'testcaseName', testcaseName });
    };
    const element = (
        <FormGroup
            labelIcon={
                <Popover
                    headerContent={
                        <div>
                            The{' '}
                            <a
                                href="https://github.com/fedora-ci/ciboard-server/blob/schema/assets/tests-metadata-schema.yaml"
                                target="_blank"
                                rel="noreferrer"
                            >
                                ResultsDB testcase
                            </a>{' '}
                        </div>
                    }
                    bodyContent={<div>Can be also JS regex match</div>}
                >
                    <button
                        type="button"
                        aria-label="More info for field testcase name"
                        onClick={(e) => e.preventDefault()}
                        className="pf-c-form__group-label-help"
                    >
                        <HelpIcon noVerticalAlign />
                    </button>
                </Popover>
            }
            label="Testcase name"
            fieldId="testcase-group"
            isStack
            isRequired
            role="group"
        >
            <TextInput
                isRequired
                type="text"
                value={testcaseName}
                aria-label="testcase name"
                onChange={handleNameChange}
                id="testcase-name-input-01"
            />
            <Checkbox
                label="is regex match"
                aria-label="testcase name is regex"
                id="testcase-is-regex-01"
                isChecked={isRegex}
                onChange={checkboxChange}
                name="is-regex"
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupPriorityProps {
    priority?: number;
}
const FormGroupPriority: FunctionComponent<FormGroupPriorityProps> = (
    props,
) => {
    const { priority } = props;
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        dispatch({ type: 'priority', priority: _.toNumber(value) });
    };
    const element = (
        <FormGroup
            label="Metadata priority"
            fieldId="form-priority"
            type="number"
            helperText="The lower number the higher priority. Default value is applied if not specified."
        >
            <TextInput
                isRequired
                type="number"
                id="form-priority"
                name="priority"
                value={priority}
                onChange={onChange}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupProductVersionProps {
    productVersion?: string;
}
const FormGroupProductVersion: FunctionComponent<
    FormGroupProductVersionProps
> = (props) => {
    const productVersion = _.defaultTo(props.productVersion, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(productVersion), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (/^[^\s]+$/.test(s)) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'productVersion', productVersion: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="Product version"
            fieldId="form-product-version"
            helperText="Keep empty to apply to all products. Example: rhel-8"
            helperTextInvalid="Invalid product"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                type="text"
                id="form-product-version"
                name="product-version"
                value={productVersion}
                onChange={onChange}
                validated={validated}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupDescriptionProps {
    description: string | undefined;
}
const FormGroupDescription: FunctionComponent<FormGroupDescriptionProps> = (
    props,
) => {
    const description = _.defaultTo(props.description, '');
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        dispatch({ type: 'description', description: value });
    };
    const element = (
        <FormGroup
            label="Description"
            fieldId="form-description"
            helperText="Information about the testcase. Its purpose, specifics, details"
        >
            <TextArea
                resizeOrientation="vertical"
                id="form-description"
                value={description}
                onChange={onChange}
                name="description"
                aria-label="testcase description"
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupWaiveMessageProps {
    message: string | undefined;
}
const FormGroupWaiveMessage: FunctionComponent<FormGroupWaiveMessageProps> = (
    props,
) => {
    const waive_message = _.defaultTo(props.message, '');
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        dispatch({ type: 'waiveMessage', waive_message: value });
    };
    const element = (
        <FormGroup
            label="Waive message"
            fieldId="form-waive-message"
            helperText="Warning message displayed in waiver form"
        >
            <TextArea
                resizeOrientation="vertical"
                id="form-waive-message"
                value={waive_message}
                onChange={onChange}
                name="waiveMessage"
                aria-label="testcase waive message"
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsTeamNameProps {
    team: string | undefined;
}
const FormGroupContactsTeamName: FunctionComponent<
    FormGroupContactsTeamNameProps
> = (props) => {
    const team = _.defaultTo(props.team, '');
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        dispatch({ type: 'contactsTeamName', team: value });
    };
    const element = (
        <FormGroup label="Team name" fieldId="form-contacts-team">
            <TextInput
                isRequired
                type="text"
                placeholder="Cool team"
                id="form-contacts-team"
                name="contacts-team"
                onChange={onChange}
                value={team}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsCINameProps {
    name: string | undefined;
}
const FormGroupContactsCIName: FunctionComponent<
    FormGroupContactsCINameProps
> = (props) => {
    const name = _.defaultTo(props.name, '');
    const dispatch = useContext(MetadataDispatchContext);
    if (_.isNull(dispatch)) return null;
    const onChange = (value: string) => {
        dispatch({ type: 'contactsCIName', name: value });
    };
    const element = (
        <FormGroup
            label="CI system name"
            fieldId="form-contacts-ci-name"
            helperText="A human readable name for the system. Example: Installability"
        >
            <TextInput
                isRequired
                type="text"
                placeholder=""
                id="form-contacts-ci-name"
                name="contacts-ci-name"
                onChange={onChange}
                value={name}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsCiSystemURLProps {
    url: string | undefined;
}
const FormGroupContactsCiSystemURL: FunctionComponent<
    FormGroupContactsCiSystemURLProps
> = (props) => {
    const url = _.defaultTo(props.url, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(url), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (validator.isURL(s)) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'contactsCiSystemURL', url: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="URL link to the system or system's web interface"
            fieldId="form-contacts-url"
            helperText="URL format"
            helperTextInvalid="Invalid url"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                isRequired
                type="text"
                placeholder="http://"
                id="form-contacts-url"
                name="contacts-url"
                onChange={onChange}
                validated={validated}
                value={url}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsDocsLinkProps {
    docs: string | undefined;
}
const FormGroupContactsDocsLink: FunctionComponent<
    FormGroupContactsDocsLinkProps
> = (props) => {
    const docs = _.defaultTo(props.docs, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(docs), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (validator.isURL(s)) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'contactsDocs', docs: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="Link to documentation"
            fieldId="form-contacts-docs"
            helperText="URL format"
            helperTextInvalid="Invalid url"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                isRequired
                type="text"
                placeholder="http://"
                id="form-contacts-docs"
                name="contacts-docs"
                onChange={onChange}
                validated={validated}
                value={docs}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsEmailProps {
    email: string | undefined;
}
const FormGroupContactsEmail: FunctionComponent<FormGroupContactsEmailProps> = (
    props,
) => {
    const email = _.defaultTo(props.email, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(email), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (validator.isEmail(s)) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'contactsEmail', email: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="Team's Email"
            fieldId="form-contacts-email"
            helperText="Email format"
            helperTextInvalid="Invalid email"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                isRequired
                type="text"
                placeholder="coolteam@redhat.com"
                id="form-contacts-email"
                name="contacts-email"
                onChange={onChange}
                validated={validated}
                value={email}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsGchatProps {
    gchat: string | undefined;
}
const FormGroupContactsGchat: FunctionComponent<FormGroupContactsGchatProps> = (
    props,
) => {
    const gchat = _.defaultTo(props.gchat, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(gchat), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (validator.isURL(s)) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'contactsGchat', gchat: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="Team's gchat room"
            fieldId="form-contacts-gchat"
            helperText="URL format"
            helperTextInvalid="Invalid url"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                isRequired
                type="text"
                placeholder="https://chat.google.com/room/AAAAwq9XDoM/ci-3Ln0mF_s"
                id="form-contacts-gchat"
                name="contacts-gchat"
                onChange={onChange}
                validated={validated}
                value={gchat}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsIrcProps {
    irc: string | undefined;
}
const FormGroupContactsIrc: FunctionComponent<FormGroupContactsIrcProps> = (
    props,
) => {
    const irc = _.defaultTo(props.irc, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(irc), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (/^[^\s]+$/.test(s) && _.startsWith(s, '#')) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'contactsIrc', irc: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="IRC channel"
            fieldId="form-contacts-irc"
            helperText="Channel name starting with #"
            helperTextInvalid="Invalid irc"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                isRequired
                type="text"
                placeholder="#coolteam"
                id="form-contacts-irc"
                name="contacts-irc"
                onChange={onChange}
                validated={validated}
                value={irc}
            />
        </FormGroup>
    );
    return element;
};

interface FormGroupContactsReportIssueProps {
    url: string | undefined;
}
const FormGroupContactsReportIssue: FunctionComponent<
    FormGroupContactsReportIssueProps
> = (props) => {
    const url = _.defaultTo(props.url, '');
    const dispatch = useContext(MetadataDispatchContext);
    useEffect(() => doValidation(url), []);
    const [validated, setValidated] = useState<Validate>('error');
    if (_.isNull(dispatch)) return null;
    const doValidation = (s: string) => {
        if (s === '') {
            setValidated('default');
        } else if (validator.isURL(s)) {
            setValidated('success');
        } else {
            setValidated('error');
        }
    };
    const onChange = (value: string) => {
        dispatch({ type: 'contactsReportIssue', url: value });
        doValidation(value);
    };
    const element = (
        <FormGroup
            label="Report issue URL"
            fieldId="form-contacts-report-issue"
            helperText="URL format"
            helperTextInvalid="Invalid url"
            helperTextInvalidIcon={<ExclamationCircleIcon />}
            validated={validated}
        >
            <TextInput
                isRequired
                type="text"
                placeholder="https://url.corp.redhat.com/rut-report-issue"
                id="form-contacts-report-issue"
                name="contacts-report-issue"
                onChange={onChange}
                validated={validated}
                value={url}
            />
        </FormGroup>
    );
    return element;
};

/*
 * Next technique based on recomendation:
 * https://reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down
 */
const MetadataDispatchContext =
    createContext<React.Dispatch<MetadataAction> | null>(null);

type MetadataAction =
    | { type: 'metadataLoaded'; metadata: MetadataRaw }
    | { type: 'newIssue' }
    | { type: 'rmIssue'; issue: KnownIssue }
    | { type: 'updateIssue'; issue: KnownIssue; updatedIssue: KnownIssue }
    | { type: 'newDependency' }
    | { type: 'rmDependency'; dependency: Dependency }
    | {
          type: 'updateDependency';
          dependency: Dependency;
          updatedDependency: Dependency;
      }
    | { type: 'productVersion'; productVersion: string }
    | { type: 'description'; description?: string }
    | { type: 'testcaseName'; testcaseName: string }
    | { type: 'testcaseNameIsRegex'; isRegex: boolean }
    | { type: 'priority'; priority: number }
    | { type: 'contactsCIName'; name?: string }
    | { type: 'contactsTeamName'; team?: string }
    | { type: 'contactsDocs'; docs?: string }
    | { type: 'contactsCiSystemURL'; url?: string }
    | { type: 'contactsEmail'; email?: string }
    | { type: 'contactsGchat'; gchat?: string }
    | { type: 'contactsIrc'; irc?: string }
    | { type: 'contactsReportIssue'; url?: string }
    | { type: 'waiveMessage'; waive_message?: string };

const metadataReducer: Reducer<MetadataRaw, MetadataAction> = (
    state,
    action,
) => {
    switch (action.type) {
        case 'productVersion': {
            return update(state, {
                product_version: { $set: action.productVersion },
            });
        }
        case 'description': {
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: { description: { $set: action.description } },
            });
        }
        case 'contactsTeamName': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: { contact: { team: { $set: action.team } } },
            });
        }
        case 'contactsCIName': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: { contact: { name: { $set: action.name } } },
            });
        }
        case 'contactsDocs': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: { contact: { docs: { $set: action.docs } } },
            });
        }
        case 'contactsCiSystemURL': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: { contact: { url: { $set: action.url } } },
            });
        }
        case 'contactsEmail': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: { contact: { email: { $set: action.email } } },
            });
        }
        case 'contactsGchat': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: {
                    contact: { gchat_room_url: { $set: action.gchat } },
                },
            });
        }
        case 'contactsIrc': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: { contact: { irc: { $set: action.irc } } },
            });
        }
        case 'contactsReportIssue': {
            state.payload = _.defaultTo(state.payload, {});
            state.payload.contact = _.defaultTo(state.payload.contact, {});
            return update(state, {
                payload: {
                    contact: { report_issue_url: { $set: action.url } },
                },
            });
        }
        case 'priority': {
            return update(state, {
                priority: { $set: action.priority },
            });
        }
        case 'testcaseName': {
            return update(state, {
                testcase_name: { $set: action.testcaseName },
            });
        }
        case 'testcaseNameIsRegex': {
            return update(state, {
                testcase_name_is_regex: { $set: action.isRegex },
            });
        }
        case 'newIssue': {
            const knownIssues = state.payload?.known_issues || [];
            const newIssues: KnownIssue[] = [
                ...knownIssues,
                {
                    info: '',
                    severity: 'normal',
                    status: 'active',
                },
            ];
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: { known_issues: { $set: newIssues } },
            });
        }
        case 'newDependency': {
            const dependency = state.payload?.dependency || [];
            const newDependencies: Dependency[] = [
                {
                    testcase_name: '',
                    dependency: 'is_required',
                    comment: '',
                },
                ...dependency,
            ];
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: { dependency: { $set: newDependencies } },
            });
        }
        case 'updateIssue': {
            const knownIssues = state.payload?.known_issues || [];
            const index = _.findIndex(knownIssues, (i) =>
                _.eq(i, action.issue),
            );
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: {
                    known_issues: { [index]: { $set: action.updatedIssue } },
                },
            });
        }
        case 'updateDependency': {
            const dependency = state.payload?.dependency || [];
            const index = _.findIndex(dependency, (i) =>
                _.eq(i, action.dependency),
            );
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: {
                    dependency: { [index]: { $set: action.updatedDependency } },
                },
            });
        }
        case 'rmIssue': {
            const knownIssues = state.payload?.known_issues || [];
            const newIssues: KnownIssue[] = _.without(
                knownIssues,
                action.issue,
            );
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: { known_issues: { $set: newIssues } },
            });
        }
        case 'rmDependency': {
            const dependency = state.payload?.dependency || [];
            const newDependencies: Dependency[] = _.without(
                dependency,
                action.dependency,
            );
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: { dependency: { $set: newDependencies } },
            });
        }
        case 'metadataLoaded': {
            const newState = _.cloneDeep(action.metadata);
            /* necessary to make sure that `update` in reducers work good */
            newState.payload = _.defaultTo(newState.payload, {});
            return newState;
        }
        case 'waiveMessage': {
            state.payload = _.defaultTo(state.payload, {});
            return update(state, {
                payload: {
                    waive_message: { $set: action.waive_message },
                },
            });
        }
        default:
            return state;
    }
};

const InitMetadata: MetadataRaw = {
    priority: 100,
    testcase_name_is_regex: false,
};

export interface MetadataPayload {
    contact?: Contact;
    description?: string;
    dependency?: Dependency[];
    known_issues?: KnownIssue[];
    waive_message?: string;
}

/* Based on reply from server */
export interface MetadataRaw {
    _id?: string;
    testcase_name?: string;
    testcase_name_is_regex?: boolean;
    priority?: number;
    product_version?: string;
    payload?: MetadataPayload;
}

interface MetadataUpdateResult {
    metadata_update: MetadataRaw;
}
interface MetadataRawResult {
    metadata_raw: MetadataRaw[];
}

export const MetadataForm: React.FunctionComponent = () => {
    const { id, clone } = useParams<{ id?: string; clone?: string }>();
    /* Note: `dispatch` won't change between re-renders */
    const [metadata, dispatch] = useReducer(metadataReducer, InitMetadata);
    const history = useHistory();

    /* on page open */
    const [getMetadata, { loading: qLoading, error: qError, data: qData }] =
        useLazyQuery<MetadataRawResult>(MetadataRawQuery, {
            errorPolicy: 'all',
            /* need to re-fetch each time when user press save/back button */
            fetchPolicy: 'network-only',
            notifyOnNetworkStatusChange: true,
        });

    useEffect(() => {
        /* ObjectID ObjectId is 24 character hex string. */
        if (_.isString(id) && id.length === 24 && validator.isHexadecimal(id)) {
            getMetadata({ variables: { _id: id } });
        }
    }, []);

    useEffect(() => {
        const haveInitData =
            !qLoading &&
            _.isObject(qData) &&
            !_.isError(qError) &&
            _.size(qData);
        if (haveInitData) {
            /* for missing entries in DB GraphQL will return `null` instead of `undefined` */
            dispatch({
                type: 'metadataLoaded',
                metadata: qData.metadata_raw[0],
            });
        }
    }, [qData]);

    /* on save */
    const [
        saveMetadata,
        { data: mData, loading: mLoading, error: mError, reset: mReset },
    ] = useMutation<MetadataUpdateResult>(MetadataUpdate, {
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
    });

    const removeEmpty = (obj: Object): any => {
        return (
            _(obj)
                /* pick objects only, skipping arrays */
                .pickBy(_.isPlainObject)
                /* call only for object values */
                .mapValues(removeEmpty)
                /* remove all empty objects */
                .omitBy(_.isEmpty)
                /* assign back not-emtpy primitive values and arrays */
                .assign(
                    _.omitBy(
                        obj,
                        _.overSome([
                            _.isPlainObject,
                            _.overEvery([_.isString, _.isEmpty]),
                        ]),
                    ),
                )
                .value()
        );
    };

    const onClickSaveAndReturn: MouseEventHandler = () => {
        /* reset the mutation's result to its initial, uncalled state. */
        mReset();
        const variables = removeEmpty(metadata);
        if (
            clone === 'clone' &&
            _.isString(metadata._id) &&
            validator.isHexadecimal(metadata._id)
        ) {
            /* ommiting _id in mutation, will create a new entry */
            delete variables._id;
        }
        saveMetadata({
            variables,
        });
    };

    const haveData = !mLoading && _.isObject(mData) && !_.isError(mError);

    useEffect(() => {
        if (haveData) {
            /* data is saved, go back to the list */
            history.push('/metadata');
        }
    }, [haveData]);

    const { contact, known_issues, dependency, description, waive_message } = _.defaultTo(
        metadata.payload,
        {},
    );

    return (
        <MetadataDispatchContext.Provider value={dispatch}>
            <Form isWidthLimited>
                <FormGroupTestcase
                    testcaseName={metadata.testcase_name}
                    isRegex={metadata.testcase_name_is_regex}
                />
                <FormGroupProductVersion
                    productVersion={metadata.product_version}
                />
                <FormGroupDescription description={description} />
                <FormGroupWaiveMessage message={waive_message} />
                <FormGroupKnownIssues issues={known_issues} />
                <FormGroupDependency dependencies={dependency} />

                <FormFieldGroup
                    header={
                        <FormFieldGroupHeader
                            titleText={{
                                text: 'Contacts',
                                id: 'field-group-non-expandable-titleText-id',
                            }}
                            titleDescription="Information about the team and the system which is performing the test"
                        />
                    }
                >
                    <FormGroupContactsCIName name={contact?.name} />
                    <FormGroupContactsTeamName team={contact?.team} />
                    <FormGroupContactsCiSystemURL url={contact?.url} />
                    <FormGroupContactsDocsLink docs={contact?.docs} />
                    <FormGroupContactsEmail email={contact?.email} />
                    <FormGroupContactsGchat gchat={contact?.gchat_room_url} />
                    <FormGroupContactsIrc irc={contact?.irc} />
                    <FormGroupContactsReportIssue
                        url={contact?.report_issue_url}
                    />
                </FormFieldGroup>
                <FormGroupPriority priority={metadata.priority} />
                <ActionGroup>
                    <Button
                        isActive={mLoading}
                        variant="primary"
                        onClick={onClickSaveAndReturn}
                    >
                        Save and return
                    </Button>
                    <Button
                        isActive={mLoading}
                        variant="link"
                        component={(props) => (
                            <Link {...props} to="/metadata" />
                        )}
                    >
                        Cancel and return
                    </Button>
                </ActionGroup>
            </Form>
            <APIError error={mError} />
        </MetadataDispatchContext.Provider>
    );
};

export function PageMetadataEdit() {
    return (
        <PageCommon title={`Metadata edit | ${config.defaultTitle}`}>
            <MetadataForm />
        </PageCommon>
    );
}
