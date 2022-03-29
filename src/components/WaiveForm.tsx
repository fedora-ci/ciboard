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

import * as React from 'react';
import { useState } from 'react';
import {
    Form,
    Text,
    Modal,
    Title,
    Button,
    Spinner,
    Tooltip,
    BaseSizes,
    FormGroup,
    TextInput,
    TextVariants,
    TextContent,
    ActionGroup,
    FormGroupProps,
} from '@patternfly/react-core';
import { useApolloClient } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import { WarningTriangleIcon, HelpIcon } from '@patternfly/react-icons';

import { docs } from '../config';
import { createWaiver, submitWaiver, resetWaiverReply } from '../actions';
import { IStateWaiver } from '../actions/types';
import { RootStateType } from '../reducers';
import { getTestcaseName } from '../utils/artifactUtils';
import _ from 'lodash';

const WaiveForm = () => {
    const dispatch = useDispatch();
    const client = useApolloClient();
    const waive = useSelector<RootStateType, IStateWaiver>(
        (store) => store.waive,
    );
    const [value, setValue] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [validated, setValidated] =
        useState<FormGroupProps['validated']>('default');
    const [madeRequest, setMadeRequest] = useState(false);

    const handleTextInputChange = (value: string) => {
        const isValid = value.trim().split(/\s+/).length > 2;
        const validated = isValid ? 'success' : 'error';
        setValue(value);
        setIsValid(isValid);
        setValidated(validated);
    };

    const onClickCancel = () => {
        dispatch(createWaiver(undefined, undefined));
    };

    const onClickSubmit = () => {
        const reason = value;
        dispatch(resetWaiverReply());
        setMadeRequest(true);
        dispatch(submitWaiver(reason, client));
    };

    const invalidText =
        'Reason must have detailed explanation. Provide links to issues, bugs, etc';
    const helperText = '';
    const { state, waiveError, timestamp } = waive;
    if (_.isNil(state)) {
        return null;
    }
    const waiver_for = getTestcaseName(state);
    return (
        <>
            <TextContent>
                <Text component={TextVariants.h3}>{waiver_for}</Text>
            </TextContent>
            <Form onSubmit={(event) => event.preventDefault()}>
                <FormGroup
                    label="Reason"
                    isRequired
                    helperText={helperText}
                    helperTextInvalid={invalidText}
                    fieldId="reason"
                    validated={validated}
                >
                    <TextInput
                        validated={validated}
                        value={value}
                        id="reason"
                        aria-describedby="age-helper"
                        onChange={handleTextInputChange}
                    />
                </FormGroup>
                <ActionGroup>
                    <Button
                        variant="primary"
                        isDisabled={!isValid}
                        onClick={onClickSubmit}
                    >
                        Submit
                    </Button>
                    <Button variant="secondary" onClick={onClickCancel}>
                        Cancel
                    </Button>
                    <Tooltip content={<div>Go to waiving documentation.</div>}>
                        <>
                            <a
                                href={docs.waiving}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <HelpIcon
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    style={{
                                        color: 'var(--pf-global--info-color--100)',
                                    }}
                                />
                            </a>
                            {waiveError && (
                                <TextContent>
                                    <Text>{waiveError}</Text>
                                </TextContent>
                            )}
                            {madeRequest && !waiveError && !timestamp && (
                                <Spinner size="md" />
                            )}
                        </>
                    </Tooltip>
                </ActionGroup>
            </Form>
        </>
    );
};

const WaiveModal = () => {
    const dispatch = useDispatch();
    const waive = useSelector<RootStateType, IStateWaiver>(
        (store) => store.waive,
    );
    const footer = (
        <Title headingLevel="h4" size="md">
            <WarningTriangleIcon />
            <span className="pf-u-pl-sm">
                You take responsibility for this action. Kerberos ID will be
                recorded.
            </span>
        </Title>
    );
    const { state, artifact, timestamp } = waive;
    const showWaiveForm = state && artifact && !timestamp ? true : false;
    const onClose = () => {
        dispatch(createWaiver(undefined, undefined));
    };
    return (
        <>
            <Modal
                variant="large"
                title="Waive test result"
                isOpen={showWaiveForm}
                onClose={onClose}
                footer={footer}
            >
                <WaiveForm />
            </Modal>
        </>
    );
};

export default WaiveModal;
