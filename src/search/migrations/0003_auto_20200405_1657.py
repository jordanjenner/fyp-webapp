# Generated by Django 3.0.4 on 2020-04-05 16:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('search', '0002_auto_20200401_1744'),
    ]

    operations = [
        migrations.AlterField(
            model_name='address',
            name='date_created',
            field=models.DateTimeField(),
        ),
    ]
