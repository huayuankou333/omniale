"""Lossless JSON presentation adapter; uses public answer formats, never references."""
import copy
import math

VERSION = 'public-format-json-presentation-v1'

def number(value):
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError('Expected a finite JSON number')
    return str(value)

def atom(value, fmt):
    if type(value) is str:
        return value
    if type(value) in (int, float):
        if fmt not in {'Bar number (digits)', 'Beat number (fraction)', 'Beat number (digits)'}:
            raise ValueError('A numeric JSON value is incompatible with the public format')
        return number(value)
    if type(value) is dict and fmt == 'Bar and beat' and set(value) == {'bar', 'beat'}:
        if type(value['bar']) is not int or value['bar'] < 1:
            raise ValueError('Invalid bar number')
        return 'bar ' + number(value['bar']) + ' beat ' + number(value['beat'])
    raise ValueError('Unsupported answer representation; no inference attempted')

def present(value, question):
    if value is None or type(value) is str:
        return value
    fmt = question['answer_format']
    if type(value) is list:
        if question.get('answer_quantity') not in {'Pair', 'List ordered by appearance', 'List unordered'}:
            raise ValueError('A JSON list is incompatible with the public quantity')
        if not value:
            return ''
        return ', '.join(atom(v, fmt) for v in value)
    return atom(value, fmt)

def adapt(submission, public_questions):
    questions = {q['question_id']: q for q in public_questions['questions']}
    result = copy.deepcopy(submission)
    changes = []
    for row in result['answers']:
        original = row['answer']
        converted = present(original, questions[row['question_id']])
        if type(original) is not type(converted) or original != converted:
            changes.append({'question_id': row['question_id'], 'original': original, 'serialized': converted,
                            'public_format': questions[row['question_id']]['answer_format']})
        row['answer'] = converted
    return result, changes
