/*
 * This file is part of ciboard

 * Copyright (c) 2022, 2023, 2024 Andrei Stepanov <astepano@redhat.com>
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
import { useState } from 'react';
import {
    Text,
    Form,
    Alert,
    Modal,
    Button,
    TextArea,
    Checkbox,
    FormGroup,
    HelperText,
    TextContent,
    ActionGroup,
    TextVariants,
    FormHelperText,
    HelperTextItem,
} from '@patternfly/react-core';
import { ExternalLinkSquareAltIcon } from '@patternfly/react-icons';
import { useApolloClient } from '@apollo/client';

import { docs } from '../config';
import { createWaiver, submitWaiver, resetWaiverReply } from '../actions';
import { useAppDispatch, useAppSelector } from '../hooks';

type Validate = 'success' | 'warning' | 'error' | 'default';

const WaiveForm: React.FC<{}> = () => {
    const dispatch = useAppDispatch();
    const waiver = useAppSelector((store) => store.waive);
    const client = useApolloClient();
    const [value, setValue] = useState('');
    const [checked, setChecked] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [validated, setValidated] = useState<Validate>('default');
    const [madeRequest, setMadeRequest] = useState(false);

    const handleTextInputChange = (value: string) => {
        /* Require that the waiver message have at least three words as a gross proxy. */
        const isValid = value.trim().split(/\s+/).length > 2;
        const validated = isValid ? 'success' : 'error';
        setValue(value);
        setIsValid(isValid);
        setValidated(validated);
    };

    const waiverFor = waiver.ciTest?.name;

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
    const agreementLabel = 'I agree and acknowledge the above information';

    const metadataAggrementText = waiver.ciTest?.waiveMessage;
    const agreementText = `Waiving test results may have an impact on the RHEL release process. Broken builds can lead to broken RHEL 
    composes and unverified or failed builds can cause issues in system integration. Before waiving these tests it is good to check 
    other possible options, in particular some CI-systems can fail due to outages and different circumstances. It is good to restart 
    the test or to contact CI-owners for assistance. Proceed waiving test-result only when other efforts have not succeeded.`;
    const { ciTest, waiveError, timestamp } = waiver;
    const testcaseName = ciTest?.name;
    if (_.isNil(testcaseName)) {
        return null;
    }
    return (
        <>
            <TextContent>
                <Text component={TextVariants.h3}>{waiverFor}</Text>
            </TextContent>
            <Form onSubmit={(event) => event.preventDefault()}>
                <TextContent>
                    <Text
                        style={{ marginTop: '0.5em' }}
                        component={TextVariants.small}
                    >
                        {metadataAggrementText || agreementText}
                    </Text>
                </TextContent>
                <FormGroup label="Reason" fieldId="reason" isRequired>
                    <TextArea
                        id="reason"
                        value={value}
                        onChange={(_event, value: string) =>
                            handleTextInputChange(value)
                        }
                        validated={validated}
                        className="pf-m-resize-vertical"
                        aria-describedby="age-helper"
                    />
                    {validated === 'error' && (
                        <FormHelperText>
                            <HelperText>
                                <HelperTextItem variant="error">
                                    {invalidText}
                                </HelperTextItem>
                            </HelperText>
                        </FormHelperText>
                    )}
                </FormGroup>
                <FormGroup
                    label="Required agreement"
                    fieldId="rquired-agreement"
                    isRequired
                >
                    <Checkbox
                        id="required-check"
                        name="required-check"
                        label={agreementLabel}
                        onChange={(_event, val) => setChecked(val)}
                        isChecked={checked}
                    />
                </FormGroup>

                <ActionGroup>
                    <Button
                        variant="primary"
                        onClick={onClickSubmit}
                        isLoading={madeRequest && !waiveError && !timestamp}
                        isDisabled={!isValid || !checked}
                    >
                        Submit
                    </Button>
                    <Button variant="secondary" onClick={onClickCancel}>
                        Cancel
                    </Button>
                    <Button
                        rel="noopener noreferrer"
                        href={docs.waiving}
                        icon={<ExternalLinkSquareAltIcon />}
                        target="_blank"
                        variant="link"
                        className="pf-v5-u-ml-auto"
                        component="a"
                        iconPosition="right"
                    >
                        Waiving documentation
                    </Button>
                </ActionGroup>
                {waiveError && (
                    <Alert
                        title="Could not submit waiver"
                        isPlain
                        variant="danger"
                        isInline
                    >
                        {waiveError}
                    </Alert>
                )}
            </Form>
        </>
    );
};

export const WaiveModal: React.FC<{}> = () => {
    const dispatch = useAppDispatch();
    const waiver = useAppSelector((store) => store.waive);
    const { artifact, ciTest, timestamp } = waiver;
    const testcaseName = ciTest;
    const showWaiveForm = artifact && !_.isEmpty(testcaseName) && !timestamp;
    const onClose = () => {
        dispatch(createWaiver(undefined, undefined));
    };
    return (
        <>
            <Modal
                variant="medium"
                title="Waive test tesult"
                isOpen={showWaiveForm}
                onClose={onClose}
            >
                <WaiveForm />
            </Modal>
        </>
    );
};
