import { gql } from '@apollo/client';

export default gql`
    query {
        waiver_db_info {
            version
            auth_method
        }
    }
`;
