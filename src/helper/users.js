import { skapi } from '@/main';
import { countries } from '@/helper/common';

export const changeSearchCondition = (value, searchParams) => {
    switch(value) {
        case 'user_id':
        case 'phone_number':
        case 'email':
        case 'gender':
        case 'locale':
        case 'birthdate':
            searchParams.condition = '=';
            break;
        case 'name':
            searchParams.condition = '>=';
            break;
    }
}

export const getValidationMessage = (searchParams) => {
    let message = '';

    switch(searchParams.searchFor) {
        case 'user_id':
            if(!skapi.validate.userId(searchParams.value)) message = 'Please enter a valid USER ID';
            break;
        case 'email':
            if(!skapi.validate.email(searchParams.value)) message = 'Please enter a valid email';
            break;
        case 'phone_number':
            if(!skapi.validate.phoneNumber(searchParams.value)) message = 'Please enter a valid phone number';
            break;
        case 'birthdate':
        case 'timestamp':
            let regex = /\d{4}-\d{2}-\d{2}/;
            if(!searchParams.value.match(regex) || !(new Date(searchParams.value).getTime())) message = 'Please enter date in YYYY-MM-DD format'
    }

    return message;
}

export const placeholder = (type) => {
    let placeholder = type.charAt(0).toUpperCase() + type.replace('_', ' ').slice(1);

    switch(type) {
        case 'timestamp':
        case 'birthdate':
            placeholder = 'YYYY-MM-DD';
            break;
        case 'locale':
            placeholder = '2 digit country code e.g. KR';
            break;
        case 'email':
            placeholder ='someone@email.com';
            break;
        case 'phone_number':
            placeholder = `eg ${countries[skapi.connection.locale].phone}1234567890`;
            break;
    }

    return placeholder;
}